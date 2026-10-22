/*
Extrait, pour chaque répondant de l'enquête OpinionWay / Forum Vies Mobiles,
l'ensemble des trajets en avion déclarés sur les trois dernières années
(2022, 2023, 2024), au format large : une ligne par ID SIMPLE, puis
7 colonnes par trajet (année, départ, arrivée, fréquence, vols internes,
cadre, motifs).

L'enquête ne demande qu'une fréquence par trajet mais autorise plusieurs
années cochées. Par défaut, le trajet occupe un bloc de colonnes par année
cochée, et sa fréquence est répartie sur ses années de la plus récente à la
plus ancienne. Le curseur de répartition est chaîné d'un trajet au suivant, y
compris d'un répondant au suivant : 4 vols sur 2022-2024 donnent 2024:2, 2023:1,
2022:1, puis le trajet suivant démarre en 2023 (2 vols → 2023:1, 2022:1,
2024:0). La somme des
blocs reste donc égale à la fréquence déclarée.

Les escales (correspondances) ne sont pas dans la base : le questionnaire
demande explicitement l'aéroport de destination finale, pas les aéroports de
correspondance. Les « vols internes » (question q10a1e, étranger seulement)
sont en revanche extraits : ce sont les vols effectués pendant le voyage, en
plus de l'aller/retour compté par la fréquence.

Command: node scripts/avion/extractTrajetsAvion.mjs [options]

Options:
  --input <path>   fichier xlsx source (défaut : scripts/avion/*.xlsx)
  --output <path>  fichier csv de sortie (défaut : scripts/avion/trajets-avion.csv)
  --sep <char>     séparateur csv (défaut : ";", adapté à Excel FR)
  --merge-years    ne pas découper les trajets multi-années : les années sont
                   concaténées dans une seule cellule, avec la fréquence totale
  --no-bom         ne pas préfixer le csv par un BOM UTF-8
*/

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { readXlsxRows } from './lib/xlsxReader.mjs'
import {
  YEARS,
  classifyTrip,
  createYearAllocator,
  csvEscape,
  expandTripYears,
  extractRespondents,
  tripPurposeLabels
} from './lib/trajets.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))

function parseArgs(argv) {
  const options = {
    input: null,
    output: path.join(HERE, 'trajets-avion.csv'),
    separator: ';',
    bom: true,
    mergeYears: false
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--input') options.input = argv[++i]
    else if (arg === '--output') options.output = argv[++i]
    else if (arg === '--sep') options.separator = argv[++i]
    else if (arg === '--merge-years') options.mergeYears = true
    else if (arg === '--no-bom') options.bom = false
    else if (arg === '--help' || arg === '-h') options.help = true
    else throw new Error(`Argument inconnu : ${arg}`)
  }

  if (!options.input) {
    // Le dossier contient aussi les bases annexes (Base1, Base2c) : on ne
    // retient que le fichier d'enquête.
    const candidates = fs
      .readdirSync(HERE)
      .filter(
        (file) =>
          file.toLowerCase().endsWith('.xlsx') && /opinionway/i.test(file)
      )
    if (candidates.length !== 1) {
      throw new Error(
        `Précisez --input : ${candidates.length} fichiers d'enquête trouvés dans ${HERE}`
      )
    }
    options.input = path.join(HERE, candidates[0])
  }

  return options
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    console.log(
      'Usage: node scripts/avion/extractTrajetsAvion.mjs [--input <xlsx>] [--output <csv>] [--sep <char>] [--merge-years] [--no-bom]'
    )
    return
  }

  const buffer = fs.readFileSync(options.input)
  const rows = readXlsxRows(buffer)
  if (rows.length < 2) throw new Error('La feuille ne contient aucune donnée')

  const respondents = extractRespondents(rows)

  const records = []
  let maxTrips = 0
  const stats = {
    respondents: 0,
    withFlights: 0,
    trips: 0,
    csvTrips: 0,
    flights: 0,
    flightsByYear: 0,
    flightsWithoutYear: 0,
    extraFlights: 0,
    tripsWithExtraFlights: 0,
    perYear: Object.fromEntries(YEARS.map((year) => [year, 0])),
    withoutYear: 0,
    perCadre: Object.fromEntries(
      ['personnel', 'professionnel', 'mixte', 'non renseigné'].map((cadre) => [
        cadre,
        { trips: 0, flights: 0 }
      ])
    )
  }

  // Un seul allocateur pour tout le fichier : le curseur traverse les
  // répondants dans l'ordre de lecture.
  const allocator = createYearAllocator()
  for (const { id, trips: extractedTrips } of respondents) {
    const uniqueTrips = allocator.allocate(extractedTrips)
    const trips = uniqueTrips.flatMap((trip) =>
      expandTripYears(trip, options.mergeYears)
    )
    const flights = uniqueTrips.reduce(
      (sum, trip) => sum + (trip.frequency ?? 0),
      0
    )
    const flew = uniqueTrips.some((trip) => (trip.frequency ?? 0) > 0)
    const extraFlights = uniqueTrips.reduce(
      (sum, trip) => sum + trip.extraFlights,
      0
    )

    stats.respondents++
    if (flew) stats.withFlights++
    stats.trips += uniqueTrips.length
    stats.csvTrips += trips.length
    stats.flights += flights
    stats.extraFlights += extraFlights
    stats.tripsWithExtraFlights += uniqueTrips.filter(
      (trip) => trip.extraFlights > 0
    ).length
    // Les statistiques par année utilisent la fréquence répartie, y compris
    // en mode --merge-years où les colonnes ne sont pas découpées.
    for (const trip of uniqueTrips) {
      const frequency = trip.frequency ?? 0
      if (trip.years.length === 0) {
        stats.flightsWithoutYear += frequency
        continue
      }
      for (const year of trip.years) {
        const yearFrequency = trip.allocation.get(year)
        stats.flightsByYear += yearFrequency
        stats.perYear[year] += yearFrequency
      }
    }
    stats.withoutYear += uniqueTrips.filter(
      (trip) => trip.years.length === 0
    ).length
    for (const trip of uniqueTrips) {
      const cadre = classifyTrip(trip)
      stats.perCadre[cadre].trips++
      stats.perCadre[cadre].flights += trip.frequency ?? 0
    }
    maxTrips = Math.max(maxTrips, trips.length)

    records.push({ id, flew, trips, uniqueTrips })
  }

  const columns = [
    'ID SIMPLE',
    'vols sur les 3 dernières années',
    'vols internes au voyage (total)',
    'vols personnels (trajets exclusifs)',
    'vols professionnels (trajets exclusifs)',
    'vols sur trajets mixtes',
    'vols sans motif renseigné'
  ]
  for (let i = 1; i <= maxTrips; i++) {
    columns.push(
      `trajet ${i} - année`,
      `trajet ${i} - départ`,
      `trajet ${i} - arrivée`,
      `trajet ${i} - fréquence`,
      `trajet ${i} - vols internes`,
      `trajet ${i} - cadre`,
      `trajet ${i} - motifs`
    )
  }

  const lines = [
    columns.map((c) => csvEscape(c, options.separator)).join(options.separator)
  ]

  for (const record of records) {
    const extraFlights = record.trips.reduce(
      (sum, trip) => sum + trip.extraFlights,
      0
    )
    // Vols par cadre, sur les trajets uniques (avant découpage par année) :
    // la fréquence d'un trajet mixte n'est pas scindable, elle est isolée.
    const flightsByCadre = Object.fromEntries(
      ['personnel', 'professionnel', 'mixte', 'non renseigné'].map((cadre) => [
        cadre,
        0
      ])
    )
    for (const trip of record.uniqueTrips) {
      flightsByCadre[classifyTrip(trip)] += trip.frequency ?? 0
    }

    const values = [
      record.id,
      record.flew ? 'oui' : 'non',
      String(extraFlights),
      String(flightsByCadre['personnel']),
      String(flightsByCadre['professionnel']),
      String(flightsByCadre['mixte']),
      String(flightsByCadre['non renseigné'])
    ]
    for (let i = 0; i < maxTrips; i++) {
      const trip = record.trips[i]
      if (!trip) {
        values.push('', '', '', '', '', '', '')
        continue
      }
      values.push(
        trip.years.join(', '),
        trip.departure ?? '',
        trip.arrival ?? '',
        trip.frequency === null ? '' : String(trip.frequency),
        trip.extraFlights === 0 ? '' : String(trip.extraFlights),
        classifyTrip(trip),
        tripPurposeLabels(trip).join(' + ')
      )
    }
    lines.push(
      values.map((v) => csvEscape(v, options.separator)).join(options.separator)
    )
  }

  const csv = (options.bom ? '\ufeff' : '') + lines.join('\r\n') + '\r\n'
  fs.mkdirSync(path.dirname(options.output), { recursive: true })
  fs.writeFileSync(options.output, csv, 'utf8')

  console.log(`Source        : ${path.basename(options.input)}`)
  console.log(`Sortie        : ${options.output}`)
  console.log(`Répondants    : ${stats.respondents}`)
  console.log(
    `Ont volé (3DA): ${stats.withFlights} (${((100 * stats.withFlights) / stats.respondents).toFixed(1)} %)`
  )
  console.log(
    `Trajets uniques: ${stats.trips} (dont ${stats.withoutYear} sans année)`
  )
  console.log(
    `Trajets en csv: ${stats.csvTrips}${options.mergeYears ? '' : ' (découpés par année)'}`
  )
  console.log(`Vols déclarés : ${stats.flights}`)
  console.log(
    `  dont sans année (non répartissables) : ${stats.flightsWithoutYear}`
  )
  console.log(
    `Vols par année: ${stats.flightsByYear}${options.mergeYears ? '' : ' (fréquence répartie par année)'}`
  )
  console.log(
    `  ${YEARS.map((year) => `${year} : ${stats.perYear[year]}`).join(' | ')}`
  )
  console.log(
    `Vols internes : ${stats.extraFlights} (sur ${stats.tripsWithExtraFlights} trajets, question q10a1e)`
  )
  console.log(
    `Total vols    : ${stats.flights + stats.extraFlights} (vers destination + internes au voyage)`
  )
  for (const [cadre, value] of Object.entries(stats.perCadre)) {
    const share = stats.flights
      ? ((100 * value.flights) / stats.flights).toFixed(1)
      : '0.0'
    console.log(
      `Cadre ${cadre.padEnd(14)}: ${String(value.flights).padStart(4)} vols (${share.padStart(4)} %) sur ${value.trips} trajets`
    )
  }
  console.log(
    `Colonnes      : ${columns.length} (max ${maxTrips} trajets par répondant)`
  )
}

main()
