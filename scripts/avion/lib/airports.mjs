// Données aéroports : nom Cabines → code IATA → coordonnées.

import fs from 'node:fs'
import path from 'node:path'

import { readXlsxRows } from './xlsxReader.mjs'

const EARTH_RADIUS_KM = 6371.0088

/** Distance orthodromique (haversine) entre deux points, en km. */
export function haversineKm([lat1, lon1], [lat2, lon2]) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)))
}

const clean = (value) =>
  value === undefined || value === null ? '' : String(value).trim()

/**
 * Charge l'annuaire aéroports.
 * `base2` fournit le passage nom d'aéroport (tel qu'utilisé dans l'enquête)
 * → code IATA ; `base1` fournit IATA → latitude/longitude.
 */
export function loadAirports({ base1Path, base2Path }) {
  const base2Rows = readXlsxRows(fs.readFileSync(base2Path))
  const nameToIata = new Map()
  for (const row of base2Rows.slice(1)) {
    const name = clean(row[0])
    const iata = clean(row[1])
    if (!name || !iata) continue
    nameToIata.set(name, iata.toUpperCase())
  }

  const base1Rows = readXlsxRows(fs.readFileSync(base1Path))
  const iataToCoordinates = new Map()
  const iataToCountry = new Map()
  for (const row of base1Rows.slice(1)) {
    const iata = clean(row[2]).toUpperCase()
    if (!iata) continue
    const latitude = Number(clean(row[5]).replace(',', '.'))
    const longitude = Number(clean(row[6]).replace(',', '.'))
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue
    // Un même code IATA peut apparaître deux fois : la première ligne gagne.
    if (!iataToCoordinates.has(iata)) {
      iataToCoordinates.set(iata, [latitude, longitude])
      iataToCountry.set(iata, clean(row[0]).toUpperCase())
    }
  }

  return { nameToIata, iataToCoordinates, iataToCountry }
}

/**
 * Renvoie { km, iata } pour une paire de noms d'aéroports, ou
 * { km: null, reason } si la distance n'est pas calculable.
 */
export function tripDistance(airports, departureName, arrivalName) {
  if (!departureName || !arrivalName) {
    return { km: null, reason: 'aéroport manquant' }
  }

  const departureIata = airports.nameToIata.get(clean(departureName))
  const arrivalIata = airports.nameToIata.get(clean(arrivalName))
  if (!departureIata || !arrivalIata) {
    return {
      km: null,
      reason: 'aéroport absent de Base2c',
      departureIata,
      arrivalIata
    }
  }

  const departure = airports.iataToCoordinates.get(departureIata)
  const arrival = airports.iataToCoordinates.get(arrivalIata)
  if (!departure || !arrival) {
    return {
      km: null,
      reason: 'coordonnées absentes de Base1',
      departureIata,
      arrivalIata
    }
  }

  return {
    km: haversineKm(departure, arrival),
    departureIata,
    arrivalIata
  }
}

export const AIRPORT_FILES = {
  base1Path: (directory) => path.join(directory, 'Base1.xlsx'),
  base2Path: (directory) => path.join(directory, 'Base2c.xlsx')
}
