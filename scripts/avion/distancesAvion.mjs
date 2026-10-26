/*
Calcule, pour chaque répondant de l'enquête OpinionWay / Forum Vies Mobiles,
la distance totale parcourue en avion sur chacune des trois dernières années
(2022, 2023, 2024), en distinguant court courrier et moyen/long courrier, et
en comptant chaque trajet en aller-retour (2 × distance aller).

La distance « aller » est la distance orthodromique (haversine) entre les
aéroports de départ et d'arrivée, obtenue en croisant Base2c (nom d'aéroport
tel qu'utilisé dans l'enquête → code IATA) et Base1 (IATA → coordonnées).

Le seuil de catégorie s'applique à la distance aller simple (par défaut
1 500 km) : en dessous, court courrier ; au-dessus, moyen/long courrier.

Par défaut, seuls les trajets **personnels** sont pris en compte (question
q8a1c / q10a1c, choix multiple) : les trajets exclusivement professionnels sont
écartés, et les trajets mixtes (motifs pro ET perso) le sont aussi (--mixed
strict par défaut). La fréquence n'existant qu'une fois par trajet, un trajet
mixte n'est pas scindable : le compter dans un cadre reviendrait à décider
arbitrairement de son motif principal. Utiliser --mixed inclusif pour le retenir
dès qu'un motif personnel est coché, et --cadre tous pour revenir à l'ensemble
des vols, tous motifs confondus.

L'enquête ne demande qu'une fréquence par trajet, mais autorise plusieurs
années cochées. Les vols sont répartis sur les années du trajet, de la plus
récente à la plus ancienne, et le curseur de répartition est chaîné d'un trajet
au suivant, y compris d'un répondant au suivant : 4 vols sur 2022-2024 donnent
2024:2, 2023:1, 2022:1 et le trajet suivant démarre en 2023 ; 2 vols donnent
alors 2023:1, 2022:1, 2024:0. La somme des colonnes annuelles est donc égale au nombre de
vols déclarés (hors trajets sans année, isolés dans leurs propres colonnes), et
« 3 ans - km total par année » égale « total réel » à ces trajets près. Ce n'est
pas la convention du script R, qui répète la fréquence sur chaque année cochée
(d'où ses 9 634 vols au lieu de 5 359).

Les vols internes au voyage (question q10a1e) ne sont pas comptés : leurs
aéroports ne sont pas renseignés dans la base.

Une partie des trajets n'a pas d'aéroport de départ renseigné (boucle de
détail interrompue). Par défaut, on l'estime par l'aéroport de départ le plus
fréquent du répondant sur ses autres trajets, puis par Paris-CDG en dernier
recours — jamais un aéroport identique à l'arrivée, qui donnerait 0 km. Les km
ainsi obtenus sont tracés dans des colonnes « dont imputés », à soustraire si
l'on ne veut que les trajets complets. Utiliser --assume-departure none pour
désactiver toute imputation.

Command: node scripts/avion/distancesAvion.mjs [options]

Options:
  --input <path>      fichier xlsx de l'enquête (défaut : scripts/avion/*OpinionWay*.xlsx)
  --base1 <path>      base aéroports IATA + coordonnées (défaut : scripts/avion/Base1.xlsx)
  --base2 <path>      base noms d'aéroports → IATA (défaut : scripts/avion/Base2c.xlsx)
  --output <path>     fichier csv de sortie (défaut : scripts/avion/distances-avion.csv)
  --threshold <km>    seuil court / moyen-long courrier (défaut : 1500)
  --assume-departure  none | home | home-then-paris | paris (défaut :
                      home-then-paris) : règle d'estimation du départ manquant
  --cadre <cadre>     personnel | professionnel | tous (défaut : personnel) :
                      ne retenir que les trajets de ce cadre (question q8a1c /
                      q10a1c, choix multiple). `tous` conserve les vols
                      professionnels et les trajets mixtes
  --mixed <mode>      strict | inclusif (défaut : strict) : traitement des
                      trajets à la fois professionnels et personnels
  --exclude <ids>     identifiants supplémentaires à écarter des analyses,
                      séparés par des virgules (en plus de la liste par défaut)
  --no-exclude        réintégrer les répondants écartés comme valeurs extrêmes
  --sep <char>        séparateur csv (défaut : ";", adapté à Excel FR)
  --no-bom            ne pas préfixer le csv par un BOM UTF-8
*/

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { readXlsxRows } from './lib/xlsxReader.mjs'
import {
  MIXED_POLICIES,
  YEARS,
  createExclusionFilter,
  createYearAllocator,
  csvEscape,
  extractRespondents,
  matchesCadre
} from './lib/trajets.mjs'
import { loadAirports, tripDistance } from './lib/airports.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))

const DEFAULT_PARIS_IATA = 'CDG'

// Tous les répondants résident en France (code INSEE renseigné) : un aéroport
// habituel situé hors d'Europe ne peut pas être leur aéroport de domicile pour
// un vol intérieur français. On garde en revanche les aéroports européens, qui
// correspondent à des frontaliers (Genève, Luxembourg, Bâle, Barcelone…).
const EUROPE_COUNTRIES = new Set([
  'FR',
  'AD',
  'AL',
  'AT',
  'BA',
  'BE',
  'BG',
  'CH',
  'CY',
  'CZ',
  'DE',
  'DK',
  'EE',
  'ES',
  'FI',
  'GB',
  'GR',
  'HR',
  'HU',
  'IE',
  'IS',
  'IT',
  'LI',
  'LT',
  'LU',
  'LV',
  'MC',
  'MD',
  'ME',
  'MK',
  'MT',
  'NL',
  'NO',
  'PL',
  'PT',
  'RO',
  'RS',
  'SE',
  'SI',
  'SK',
  'SM',
  'TR',
  'UA',
  'XK'
])

const DEPARTURE_MODES = ['none', 'home', 'home-then-paris', 'paris']

// Cadres de vol : la question q8a1c / q10a1c demande « dans quel cadre avez-vous
// volé vers X ? » (choix multiple). `tous` conserve le comportement historique.
const CADRE_MODES = ['tous', 'personnel', 'professionnel']

const toRounded = (value) => String(Math.round(value))

const findSurvey = () => {
  const candidates = fs
    .readdirSync(HERE)
    .filter(
      (file) => file.toLowerCase().endsWith('.xlsx') && /opinionway/i.test(file)
    )
  if (candidates.length !== 1) {
    throw new Error(
      `Précisez --input : ${candidates.length} fichiers d'enquête trouvés dans ${HERE}`
    )
  }
  return path.join(HERE, candidates[0])
}

function parseArgs(argv) {
  const options = {
    input: null,
    base1: path.join(HERE, 'Base1.xlsx'),
    base2: path.join(HERE, 'Base2c.xlsx'),
    output: path.join(HERE, 'distances-avion.csv'),
    threshold: 1500,
    assumeDeparture: 'home-then-paris',
    cadre: 'personnel',
    mixedPolicy: 'strict',
    exclude: true,
    excludeIds: [],
    separator: ';',
    bom: true
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--input') options.input = argv[++i]
    else if (arg === '--base1') options.base1 = argv[++i]
    else if (arg === '--base2') options.base2 = argv[++i]
    else if (arg === '--output') options.output = argv[++i]
    else if (arg === '--threshold') options.threshold = Number(argv[++i])
    else if (arg === '--assume-departure') options.assumeDeparture = argv[++i]
    else if (arg === '--cadre') options.cadre = argv[++i]
    else if (arg === '--mixed') options.mixedPolicy = argv[++i]
    else if (arg === '--exclude')
      options.excludeIds = String(argv[++i])
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    else if (arg === '--no-exclude') options.exclude = false
    else if (arg === '--sep') options.separator = argv[++i]
    else if (arg === '--no-bom') options.bom = false
    else if (arg === '--help' || arg === '-h') options.help = true
    else throw new Error(`Argument inconnu : ${arg}`)
  }

  if (!Number.isFinite(options.threshold) || options.threshold <= 0) {
    throw new Error('--threshold attend un nombre de kilomètres positif')
  }
  if (!DEPARTURE_MODES.includes(options.assumeDeparture)) {
    throw new Error(
      `--assume-departure attend ${DEPARTURE_MODES.join(' | ')}, reçu : ${options.assumeDeparture}`
    )
  }
  if (!CADRE_MODES.includes(options.cadre)) {
    throw new Error(
      `--cadre attend ${CADRE_MODES.join(' | ')}, reçu : ${options.cadre}`
    )
  }
  if (!MIXED_POLICIES.includes(options.mixedPolicy)) {
    throw new Error(
      `--mixed attend ${MIXED_POLICIES.join(' | ')}, reçu : ${options.mixedPolicy}`
    )
  }
  if (!options.input) options.input = findSurvey()

  return options
}

const emptyBucket = () => ({ court: 0, moyenLong: 0 })

function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    console.log(
      'Usage: node scripts/avion/distancesAvion.mjs [--input <xlsx>] [--base1 <xlsx>] [--base2 <xlsx>] [--output <csv>] [--threshold <km>] [--assume-departure <mode>] [--sep <char>] [--no-bom]'
    )
    return
  }

  const airports = loadAirports({
    base1Path: options.base1,
    base2Path: options.base2
  })

  const rows = readXlsxRows(fs.readFileSync(options.input))
  if (rows.length < 2) throw new Error('La feuille ne contient aucune donnée')
  const respondents = extractRespondents(rows)

  const iataToName = new Map()
  for (const [name, iata] of airports.nameToIata) {
    if (!iataToName.has(iata)) iataToName.set(iata, name)
  }

  // Aéroport de départ le plus fréquent de chaque répondant : sert à imputer
  // les trajets dont le départ n'a pas été renseigné. On n'utilise que les
  // départs réellement connus, donc pas de propagation d'une imputation.
  const homeAirport = new Map()
  for (const { id, trips } of respondents) {
    const counts = new Map()
    for (const trip of trips) {
      const distance = tripDistance(airports, trip.departure, trip.arrival)
      if (distance.departureIata) {
        counts.set(
          distance.departureIata,
          (counts.get(distance.departureIata) ?? 0) + 1
        )
      }
    }
    if (counts.size === 0) continue
    const [iata] = [...counts.entries()].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
    )[0]
    homeAirport.set(id, iata)
  }

  const stats = {
    respondents: 0,
    trips: 0,
    tripsWithoutDistance: 0,
    flightsWithoutDistance: 0,
    tripsWithoutFrequency: 0,
    tripsWithoutYear: 0,
    flightsWithoutYear: 0,
    tripsSameAirport: 0,
    respondentsWithZeroDistance: 0,
    tripsWithoutDeparture: 0,
    tripsWithoutArrival: 0,
    tripsUnknownAirport: 0,
    tripsUnknownCoordinates: 0,
    imputedTrips: 0,
    imputedFlights: 0,
    imputedKm: 0,
    imputedFromHome: 0,
    imputedFromParis: 0,
    imputedForeignHome: 0,
    imputedSkippedSameAirport: 0,
    imputedSkippedNoCandidate: 0,
    imputedSkippedNonEuropeanHome: 0,
    realDistance: 0,
    perYear: Object.fromEntries(
      YEARS.map((year) => [
        year,
        { court: 0, moyenLong: 0, flights: emptyBucket() }
      ])
    ),
    imputedPerYear: Object.fromEntries(YEARS.map((year) => [year, 0])),
    missingAirports: new Map(),
    tripsExcludedByCadre: 0,
    excludedRespondents: 0
  }

  const records = []
  // Un seul allocateur pour tout le fichier : le curseur traverse les
  // répondants dans l'ordre de lecture. L'allocation a lieu avant le filtre
  // d'exclusion, pour que la ventilation annuelle des autres répondants reste
  // identique à celle d'une exécution sans exclusion.
  const allocator = createYearAllocator()
  const isExcluded = createExclusionFilter({
    exclude: options.exclude,
    extra: options.excludeIds
  })
  for (const { id, trips: extractedTrips } of respondents) {
    const trips = allocator.allocate(extractedTrips)
    if (isExcluded(id)) {
      stats.excludedRespondents++
      continue
    }
    const perYear = Object.fromEntries(
      YEARS.map((year) => [
        year,
        { court: 0, moyenLong: 0, flights: emptyBucket() }
      ])
    )
    const imputedPerYear = Object.fromEntries(YEARS.map((year) => [year, 0]))
    let realDistance = 0
    let withoutYearKm = 0
    let withoutYearFlights = 0
    let missingKmFlights = 0
    let missingTrips = 0
    let noFrequencyTrips = 0
    let imputedKm = 0
    let imputedFlights = 0
    let imputedTrips = 0
    let imputedWithoutYearKm = 0
    let tripsKept = 0

    for (const trip of trips) {
      stats.trips++

      // Filtre de cadre appliqué après la répartition par année : le curseur
      // reste celui du fichier complet, donc les trajets retenus gardent la
      // même ventilation annuelle que dans une exécution sans filtre.
      if (!matchesCadre(trip, options.cadre, options.mixedPolicy)) {
        stats.tripsExcludedByCadre++
        continue
      }
      tripsKept++

      const frequency = trip.frequency ?? 0
      let distance = tripDistance(airports, trip.departure, trip.arrival)
      let imputed = false

      // Imputation du départ manquant : aéroport habituel du répondant, puis
      // Paris-CDG en dernier recours. On refuse tout candidat identique à
      // l'arrivée (distance nulle, cas des retours au domicile).
      if (
        distance.km === null &&
        !trip.departure &&
        trip.arrival &&
        frequency > 0 &&
        options.assumeDeparture !== 'none'
      ) {
        const homeIata = homeAirport.get(id)
        const candidates = []
        if (
          (options.assumeDeparture === 'home' ||
            options.assumeDeparture === 'home-then-paris') &&
          homeIata
        ) {
          candidates.push({ iata: homeIata, source: 'home' })
        }
        if (
          options.assumeDeparture === 'paris' ||
          options.assumeDeparture === 'home-then-paris'
        ) {
          candidates.push({ iata: DEFAULT_PARIS_IATA, source: 'paris' })
        }

        for (const candidate of candidates) {
          const name = iataToName.get(candidate.iata)
          if (!name) continue
          const arrivalCountry = airports.nameToIata.get(trip.arrival)
          const arrivalIsFrance =
            airports.iataToCountry.get(arrivalCountry) === 'FR'
          const homeCountry = airports.iataToCountry.get(candidate.iata)
          if (
            candidate.source === 'home' &&
            arrivalIsFrance &&
            !EUROPE_COUNTRIES.has(homeCountry)
          ) {
            stats.imputedSkippedNonEuropeanHome++
            continue
          }
          const attempt = tripDistance(airports, name, trip.arrival)
          if (attempt.km === null) continue
          if (attempt.km < 1) {
            stats.imputedSkippedSameAirport++
            continue
          }
          distance = attempt
          imputed = true
          stats.imputedTrips++
          stats.imputedFlights += frequency
          if (candidate.source === 'home') {
            stats.imputedFromHome++
            if (airports.iataToCountry.get(candidate.iata) !== 'FR') {
              stats.imputedForeignHome++
            }
          } else stats.imputedFromParis++
          break
        }
        if (!imputed) stats.imputedSkippedNoCandidate++
      }

      if (distance.km === null) {
        missingTrips++
        missingKmFlights += frequency
        stats.tripsWithoutDistance++
        stats.flightsWithoutDistance += frequency
        if (!trip.departure) stats.tripsWithoutDeparture++
        else if (!trip.arrival) stats.tripsWithoutArrival++
        else if (distance.reason === 'aéroport absent de Base2c') {
          stats.tripsUnknownAirport++
          const name = distance.departureIata ? trip.arrival : trip.departure
          stats.missingAirports.set(
            name ?? '(inconnu)',
            (stats.missingAirports.get(name ?? '(inconnu)') ?? 0) + 1
          )
        } else stats.tripsUnknownCoordinates++
        continue
      }

      if (distance.km < 1) {
        stats.tripsSameAirport++
        continue
      }

      if (frequency <= 0) {
        noFrequencyTrips++
        stats.tripsWithoutFrequency++
        continue
      }

      // Aller-retour : la fréquence compte les vols vers la destination
      const roundTripKm = 2 * frequency * distance.km
      const category = distance.km < options.threshold ? 'court' : 'moyenLong'

      realDistance += roundTripKm
      if (imputed) {
        imputedTrips++
        imputedFlights += frequency
        imputedKm += roundTripKm
        stats.imputedKm += roundTripKm
      }

      if (trip.years.length === 0) {
        withoutYearKm += roundTripKm
        withoutYearFlights += frequency
        if (imputed) imputedWithoutYearKm += roundTripKm
        stats.tripsWithoutYear++
        stats.flightsWithoutYear += frequency
        continue
      }

      // Les vols d'un trajet coché sur plusieurs années sont répartis sur ses
      // années, en chaînant le curseur d'un trajet au suivant.
      for (const year of trip.years) {
        const yearFrequency = trip.allocation.get(year)
        const yearKm = 2 * yearFrequency * distance.km
        perYear[year][category] += yearKm
        perYear[year].flights[category] += yearFrequency
        stats.perYear[year][category] += yearKm
        stats.perYear[year].flights[category] += yearFrequency
        if (imputed) {
          imputedPerYear[year] += yearKm
          stats.imputedPerYear[year] += yearKm
        }
      }
    }

    // Avec un filtre de cadre, un répondant peut n'avoir aucun trajet retenu :
    // ce n'est alors pas une distance nulle, mais une absence de vol du cadre.
    // On ne compte donc que les répondants dont au moins un trajet a passé le
    // filtre et qui totalisent malgré tout 0 km.
    if (realDistance === 0 && tripsKept > 0) {
      stats.respondentsWithZeroDistance++
    }

    records.push({
      id,
      perYear,
      imputedPerYear,
      realDistance,
      imputedKm,
      imputedFlights,
      imputedTrips,
      imputedWithoutYearKm,
      withoutYearKm,
      withoutYearFlights,
      missingKmFlights,
      missingTrips,
      noFrequencyTrips
    })
    stats.respondents++
    stats.realDistance += realDistance
  }

  const columns = ['ID SIMPLE']
  for (const year of YEARS) {
    columns.push(
      `${year} - vols court courrier (< ${options.threshold} km)`,
      `${year} - km court courrier (A/R)`,
      `${year} - vols moyen/long courrier (>= ${options.threshold} km)`,
      `${year} - km moyen/long courrier (A/R)`,
      `${year} - km total (A/R)`,
      `${year} - km total dont imputés (A/R)`
    )
  }
  columns.push(
    '3 ans - km court courrier (A/R)',
    '3 ans - km moyen/long courrier (A/R)',
    '3 ans - km total par année (A/R)',
    '3 ans - km total réel (trajets uniques, A/R)',
    '3 ans - km imputés (départ estimé, A/R)',
    'trajets imputés (nb)',
    'trajets imputés - vols',
    'trajets sans année - km (non attribuable)',
    'trajets sans année dont imputés - km',
    'trajets sans année - vols (non attribuable)',
    'trajets sans distance - vols'
  )

  const lines = [
    columns.map((c) => csvEscape(c, options.separator)).join(options.separator)
  ]

  for (const record of records) {
    const values = [record.id]
    let court3 = 0
    let moyenLong3 = 0
    for (const year of YEARS) {
      const bucket = record.perYear[year]
      court3 += bucket.court
      moyenLong3 += bucket.moyenLong
      values.push(
        String(bucket.flights.court),
        toRounded(bucket.court),
        String(bucket.flights.moyenLong),
        toRounded(bucket.moyenLong),
        toRounded(bucket.court + bucket.moyenLong),
        toRounded(record.imputedPerYear[year])
      )
    }
    values.push(
      toRounded(court3),
      toRounded(moyenLong3),
      toRounded(court3 + moyenLong3),
      toRounded(record.realDistance),
      toRounded(record.imputedKm),
      String(record.imputedTrips),
      String(record.imputedFlights),
      toRounded(record.withoutYearKm),
      toRounded(record.imputedWithoutYearKm),
      String(record.withoutYearFlights),
      String(record.missingKmFlights)
    )
    lines.push(
      values.map((v) => csvEscape(v, options.separator)).join(options.separator)
    )
  }

  const csv = (options.bom ? '\ufeff' : '') + lines.join('\r\n') + '\r\n'
  fs.mkdirSync(path.dirname(options.output), { recursive: true })
  fs.writeFileSync(options.output, csv, 'utf8')

  const court = YEARS.reduce((sum, year) => sum + stats.perYear[year].court, 0)
  const moyenLong = YEARS.reduce(
    (sum, year) => sum + stats.perYear[year].moyenLong,
    0
  )
  const total = court + moyenLong

  console.log(`Source        : ${path.basename(options.input)}`)
  console.log(
    `Aéroports     : ${airports.nameToIata.size} noms, ${airports.iataToCoordinates.size} codes IATA`
  )
  console.log(`Seuil         : ${options.threshold} km (distance aller simple)`)
  console.log(`Départ manquant : ${options.assumeDeparture}`)
  console.log(
    `Cadre         : ${options.cadre}${options.cadre === 'personnel' ? ' (défaut)' : ''}${
      options.cadre === 'tous'
        ? ', tous motifs confondus'
        : `, trajets mixtes : ${options.mixedPolicy}${options.mixedPolicy === 'strict' ? ' (défaut)' : ''}`
    }`
  )
  console.log(`Sortie        : ${options.output}`)
  console.log(`Répondants    : ${stats.respondents}`)
  if (stats.excludedRespondents > 0) {
    console.log(
      `  écartés (valeurs extrêmes) : ${stats.excludedRespondents} répondant(s), voir EXCLUDED_RESPONDENTS`
    )
  }
  console.log(`Trajets       : ${stats.trips}`)
  if (stats.tripsExcludedByCadre > 0) {
    console.log(
      `  écartés par le filtre de cadre : ${stats.tripsExcludedByCadre} trajets`
    )
  }
  console.log(
    `  sans distance calculable : ${stats.tripsWithoutDistance} trajets (${stats.flightsWithoutDistance} vols)`
  )
  console.log(
    `    dont sans aéroport de départ : ${stats.tripsWithoutDeparture}`
  )
  console.log(`    dont sans aéroport d'arrivée : ${stats.tripsWithoutArrival}`)
  console.log(
    `    dont nom absent de Base2c     : ${stats.tripsUnknownAirport}`
  )
  console.log(
    `    dont coordonnées absentes     : ${stats.tripsUnknownCoordinates}`
  )
  console.log(`  départ = arrivée (0 km)  : ${stats.tripsSameAirport} trajets`)
  console.log(
    `  sans fréquence déclarée  : ${stats.tripsWithoutFrequency} trajets`
  )
  console.log(
    `  sans année renseignée    : ${stats.tripsWithoutYear} trajets (${stats.flightsWithoutYear} vols, ${Math.round(
      records.reduce((sum, record) => sum + record.withoutYearKm, 0)
    )} km)`
  )
  console.log(
    `  répondants à 0 km        : ${stats.respondentsWithZeroDistance}`
  )
  console.log(
    `Imputation du départ (${options.assumeDeparture}) : ${stats.imputedTrips} trajets, ${stats.imputedFlights} vols, ${Math.round(
      stats.imputedKm
    )} km`
  )
  if (options.assumeDeparture !== 'none') {
    console.log(
      `  dont aéroport habituel   : ${stats.imputedFromHome} (dont ${stats.imputedForeignHome} hors France)`
    )
    console.log(`  dont Paris-CDG (repli)   : ${stats.imputedFromParis}`)
    console.log(
      `  écartés (départ = arrivée) : ${stats.imputedSkippedSameAirport} | sans candidat : ${stats.imputedSkippedNoCandidate}`,
      `  aéroport habituel hors Europe écarté : ${stats.imputedSkippedNonEuropeanHome}`
    )
  }
  if (stats.missingAirports.size > 0) {
    console.log('Aéroports absents de Base2c :')
    for (const [name, count] of stats.missingAirports) {
      console.log(`  ${count}× ${name}`)
    }
  }
  console.log('')
  console.log('Vols et distances par année (A/R) :')
  for (const year of YEARS) {
    const bucket = stats.perYear[year]
    console.log(
      `  ${year} : court ${bucket.flights.court} vols / ${Math.round(
        bucket.court
      )} km | moyen-long ${bucket.flights.moyenLong} vols / ${Math.round(
        bucket.moyenLong
      )} km | total ${Math.round(bucket.court + bucket.moyenLong)} km`
    )
  }
  console.log(
    `  somme des 3 ans : court ${Math.round(court)} km | moyen-long ${Math.round(
      moyenLong
    )} km | total ${Math.round(total)} km`
  )
  console.log(
    `  total réel (trajets uniques) : ${Math.round(stats.realDistance)} km, soit ${(
      (100 * court) /
      (total || 1)
    ).toFixed(1)} % court courrier`
  )
  console.log(`Colonnes      : ${columns.length}`)
}

main()
