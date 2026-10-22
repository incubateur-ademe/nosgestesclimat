/*
Synthèse des pratiquants de l'avion sur les trois dernières années.

Deux populations sont distinguées, à partir des vols répartis par année
(répartition de la plus récente à la plus ancienne, curseur chaîné d'un trajet
au suivant, y compris entre répondants — voir lib/trajets.mjs) :

  - « tous les ans » : au moins un vol en 2022, en 2023 et en 2024 ;
  - « occasionnels » : au moins un vol sur les trois années, mais pas chaque
    année.

Pour chacune, le script donne la moyenne par personne du nombre de vols et des
kilomètres (aller-retour), année par année, puis ramenée à l'année sur la
période. Les moyennes sont fournies non pondérées et pondérées par le poids de
calage de la population générale (POIDS_GP).

Par défaut, seuls les trajets **personnels** sont comptés (vols non
professionnels), les trajets mixtes étant inclus dès qu'un motif personnel est
coché (--mixed inclusif). Voir --cadre pour inclure aussi les vols
professionnels, et --mixed strict pour exclure les trajets mixtes.

Les kilomètres proviennent de distances-avion.csv, produit par
distancesAvion.mjs ; lancer ce script d'abord pour les obtenir.

Command: node scripts/avion/syntheseAvion.mjs [options]

Options:
  --input <path>    fichier xlsx de l'enquête (défaut : scripts/avion/*OpinionWay*.xlsx)
  --distances <csv> fichier des distances par année (défaut : scripts/avion/distances-avion.csv)
  --output <path>   fichier csv de sortie (défaut : scripts/avion/synthese-avion.csv)
  --gp-only         ne retenir que les répondants de la cible « population générale »
  --cadre <cadre>   personnel | professionnel | tous (défaut : personnel) : ne
                    compter que les trajets de ce cadre (questions q8a1c /
                    q10a1c). `tous` conserve vols professionnels et mixtes.
                    La ventilation annuelle reste celle du fichier complet.
  --mixed <mode>    strict | inclusif (défaut : inclusif) : traitement des trajets
                    à la fois professionnels et personnels
  --sep <char>      séparateur csv (défaut : ";", adapté à Excel FR)
  --no-bom          ne pas préfixer le csv par un BOM UTF-8
*/

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { readXlsxRows } from './lib/xlsxReader.mjs'
import {
  MIXED_POLICIES,
  YEARS,
  createYearAllocator,
  csvEscape,
  extractRespondents,
  matchesCadre
} from './lib/trajets.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))

// Métriques ventilées dans les sorties. Les vols totaux proviennent du
// questionnaire ; les vols par catégorie et les km viennent des distances.
const METRICS = [
  'courtFlights',
  'mlFlights',
  'unallocatedFlights',
  'km',
  'courtKm',
  'mlKm'
]

const CADRE_MODES = ['tous', 'personnel', 'professionnel']

const GROUPS = {
  everyYear: 'tous les ans (2022, 2023 et 2024)',
  occasional: 'au moins 1 vol sur 3 ans, pas tous les ans',
  none: 'aucun vol sur les 3 ans',
  withoutYear: 'vols sans année, aucun vol attribuable',
  allFlyers: 'ensemble des personnes ayant volé sur 3 ans',
  allRespondents: 'ensemble des répondants (non-voyageurs inclus)'
}

function parseArgs(argv) {
  const options = {
    input: null,
    distances: path.join(HERE, 'distances-avion.csv'),
    output: path.join(HERE, 'synthese-avion.csv'),
    gpOnly: false,
    cadre: 'personnel',
    mixedPolicy: 'inclusif',
    separator: ';',
    bom: true
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--input') options.input = argv[++i]
    else if (arg === '--distances') options.distances = argv[++i]
    else if (arg === '--output') options.output = argv[++i]
    else if (arg === '--gp-only') options.gpOnly = true
    else if (arg === '--cadre') options.cadre = argv[++i]
    else if (arg === '--mixed') options.mixedPolicy = argv[++i]
    else if (arg === '--sep') options.separator = argv[++i]
    else if (arg === '--no-bom') options.bom = false
    else if (arg === '--help' || arg === '-h') options.help = true
    else throw new Error(`Argument inconnu : ${arg}`)
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

  if (!options.input) {
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

const clean = (value) =>
  value === undefined || value === null ? '' : String(value).trim()

const toNumber = (value) => {
  const text = clean(value).replace(',', '.')
  if (text === '') return null
  const number = Number(text)
  return Number.isFinite(number) ? number : null
}

/** Lit un csv séparé par `;` en gérant les champs entre guillemets. */
function readCsv(text, separator) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  const source = text.replace(/^\ufeff/, '')

  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"'
          i++
        } else quoted = false
      } else field += char
      continue
    }
    if (char === '"') quoted = true
    else if (char === separator) {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''))
      rows.push(row)
      row = []
      field = ''
    } else field += char
  }
  if (field !== '' || row.length > 0) {
    row.push(field.replace(/\r$/, ''))
    rows.push(row)
  }
  return rows
}

// Colonnes lues dans distances-avion.csv, repérées par motif pour rester
// indépendantes du seuil court / moyen-long choisi à la génération.
const DISTANCE_COLUMNS = [
  { metric: 'km', pattern: /^(\d{4}) - km total \(A\/R\)$/ },
  { metric: 'courtKm', pattern: /^(\d{4}) - km court courrier/ },
  { metric: 'mlKm', pattern: /^(\d{4}) - km moyen\/long courrier/ },
  { metric: 'courtFlights', pattern: /^(\d{4}) - vols court courrier/ },
  { metric: 'mlFlights', pattern: /^(\d{4}) - vols moyen\/long courrier/ }
]

function loadDistances(file) {
  if (!fs.existsSync(file)) return null
  const rows = readCsv(fs.readFileSync(file, 'utf8'), ';')
  const [header, ...data] = rows
  const indexId = header.indexOf('ID SIMPLE')
  if (indexId === -1) return null

  // index[metric][year] = numéro de colonne
  const index = {}
  for (const { metric, pattern } of DISTANCE_COLUMNS) {
    index[metric] = {}
    header.forEach((name, position) => {
      const match = pattern.exec(name)
      if (!match) return
      const year = Number(match[1])
      if (YEARS.includes(year)) index[metric][year] = position
    })
    if (Object.keys(index[metric]).length !== YEARS.length) return null
  }

  const byId = new Map()
  for (const row of data) {
    const id = clean(row[indexId])
    if (id === '') continue
    const perYear = {}
    for (const year of YEARS) {
      perYear[year] = {
        km: toNumber(row[index.km[year]]) ?? 0,
        courtKm: toNumber(row[index.courtKm[year]]) ?? 0,
        mlKm: toNumber(row[index.mlKm[year]]) ?? 0,
        courtFlights: toNumber(row[index.courtFlights[year]]) ?? 0,
        mlFlights: toNumber(row[index.mlFlights[year]]) ?? 0
      }
    }
    byId.set(id, perYear)
  }
  return byId
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    console.log(
      'Usage: node scripts/avion/syntheseAvion.mjs [--input <xlsx>] [--distances <csv>] [--output <csv>] [--gp-only] [--sep <char>] [--no-bom]'
    )
    return
  }

  const rows = readXlsxRows(fs.readFileSync(options.input))
  if (rows.length < 2) throw new Error('La feuille ne contient aucune donnée')

  const header = rows[0].map((value) =>
    value === undefined ? '' : clean(value)
  )
  const idIndex = header.findIndex((name) => name.toUpperCase() === 'ID SIMPLE')
  if (idIndex === -1) throw new Error('Colonne "ID SIMPLE" introuvable')
  const weightIndex = header.findIndex((name) => /^POIDS_GP/i.test(name))
  const targetIndex = header.findIndex((name) => /^GP\.\s*Cible GP/i.test(name))

  const weights = new Map()
  const targets = new Map()
  for (const row of rows.slice(1)) {
    const id = clean(row[idIndex])
    if (id === '') continue
    weights.set(id, toNumber(row[weightIndex]) ?? 0)
    targets.set(id, clean(row[targetIndex]))
  }

  // POIDS_GP est un poids de calage interne à la cible « population générale » :
  // il vaut 0 pour les répondants recrutés uniquement comme grands voyageurs
  // (GV) ou non voyageurs (NV), et sa somme sur la cible GP vaut l'effectif GP.
  // La valeur « pondérée » de l'ensemble des répondants porte donc en réalité
  // sur le sous-échantillon GP, pas sur les 1 647 répondants.
  const gpRespondents = [...weights.values()].filter((w) => w > 0).length

  const distances = loadDistances(options.distances)
  const respondents = extractRespondents(rows)

  const buckets = Object.fromEntries(
    Object.keys(GROUPS).map((key) => [key, []])
  )

  // Un seul allocateur pour tout le fichier : le curseur traverse les
  // répondants dans l'ordre de lecture.
  // L'allocation se fait sur TOUS les répondants, même avec --gp-only : le
  // curseur reste ainsi identique à celui de distancesAvion.mjs, et les
  // colonnes court / moyen-long (lues dans son CSV) restent cohérentes avec
  // le nombre de vols. Le filtre de population s'applique au classement.
  const allocator = createYearAllocator()
  for (const { id, trips: extractedTrips } of respondents) {
    const trips = allocator.allocate(extractedTrips)

    const flights = Object.fromEntries(YEARS.map((year) => [year, 0]))
    let flightsWithoutYear = 0

    for (const trip of trips) {
      // Filtre de cadre appliqué après la répartition : le curseur annuel reste
      // celui du fichier complet, identique à celui de distancesAvion.mjs.
      if (!matchesCadre(trip, options.cadre, options.mixedPolicy)) continue

      const frequency = trip.frequency ?? 0
      if (trip.years.length === 0) {
        flightsWithoutYear += frequency
        continue
      }
      for (const year of trip.years) flights[year] += trip.allocation.get(year)
    }

    const total = YEARS.reduce((sum, year) => sum + flights[year], 0)
    const everyYear = YEARS.every((year) => flights[year] > 0)

    // Vols et km par année, ventilés court / moyen-long courrier. Les valeurs
    // de distance et de catégorie proviennent de distances-avion.csv, seul
    // script qui connaît la distance de chaque trajet.
    const distancePerYear = distances?.get(id) ?? null
    const perYear = {}
    for (const year of YEARS) {
      const measured = distancePerYear?.[year]
      const courtFlights = measured?.courtFlights ?? 0
      const mlFlights = measured?.mlFlights ?? 0
      perYear[year] = {
        flights: flights[year],
        courtFlights,
        mlFlights,
        // Vols déclarés qui n'ont pas pu être classés : aéroport manquant ou
        // inconnu, ou départ égal à l'arrivée (distance nulle). Ils sont dans
        // `flights` mais dans aucune catégorie, d'où cette colonne qui rétablit
        // l'identité vols = court + moyen/long + non ventilés.
        unallocatedFlights: Math.max(
          0,
          flights[year] - courtFlights - mlFlights
        ),
        km: measured?.km ?? 0,
        courtKm: measured?.courtKm ?? 0,
        mlKm: measured?.mlKm ?? 0
      }
    }

    const totals = { flights: total }
    for (const metric of METRICS) {
      totals[metric] = YEARS.reduce(
        (sum, year) => sum + perYear[year][metric],
        0
      )
    }

    const record = {
      id,
      weight: weights.get(id) ?? 0,
      perYear,
      totals,
      hasDistances: distancePerYear !== null
    }

    if (options.gpOnly && targets.get(id) !== 'Cible GP') continue

    if (total > 0) {
      buckets[everyYear ? 'everyYear' : 'occasional'].push(record)
      buckets.allFlyers.push(record)
    } else {
      buckets.none.push(record)
      if (flightsWithoutYear > 0) {
        buckets.withoutYear.push({ ...record, flightsWithoutYear })
      }
    }
  }

  // Moyennes : effectif, vols et km moyens par personne (0 si absent).
  const average = (records, pick, weighted) => {
    if (records.length === 0) return null
    const denominator = weighted
      ? records.reduce((sum, record) => sum + record.weight, 0)
      : records.length
    if (denominator === 0) return null
    const numerator = records.reduce(
      (sum, record) => sum + (weighted ? record.weight : 1) * pick(record),
      0
    )
    return numerator / denominator
  }

  // Libellés des métriques pour l'en-tête CSV et la console.
  const LABELS = {
    flights: 'vols',
    courtFlights: 'vols court courrier',
    mlFlights: 'vols moyen/long courrier',
    unallocatedFlights: 'vols non ventilés (catégorie inconnue)',
    km: 'km A/R',
    courtKm: 'km court courrier A/R',
    mlKm: 'km moyen/long courrier A/R'
  }
  const UNITS = {
    flights: 'vols / personne',
    courtFlights: 'vols / personne',
    mlFlights: 'vols / personne',
    unallocatedFlights: 'vols / personne',
    km: 'km A/R / personne',
    courtKm: 'km A/R / personne',
    mlKm: 'km A/R / personne'
  }

  const activeMetrics = distances
    ? [
        'flights',
        'courtFlights',
        'mlFlights',
        'unallocatedFlights',
        'km',
        'courtKm',
        'mlKm'
      ]
    : ['flights']

  const lines = []
  lines.push([
    'population',
    'periode',
    'effectif',
    'effectif pondéré',
    ...activeMetrics.flatMap((metric) => [
      `${LABELS[metric]} / personne (non pondéré)`,
      `${LABELS[metric]} / personne (pondéré)`
    ])
  ])

  const format = (value, digits = 2) =>
    value === null || value === undefined ? '' : value.toFixed(digits)

  // Les km sont arrondis à l'unité, les vols à deux décimales.
  const DIGITS = { km: 0, courtKm: 0, mlKm: 0 }

  // `metricValue` renvoie la valeur d'une métrique pour une période : une
  // année (« 2022 »), la moyenne annuelle sur 3 ans (« mean3 ») ou le cumul
  // (« total »). Le cumul de chaque métrique est stocké dans record.totals.
  const MEAN3 = 'moyenne annuelle sur 3 ans'
  const TOTAL3 = 'total sur 3 ans'

  const metricValue = (record, metric, period) => {
    if (period === MEAN3) return record.totals[metric] / 3
    if (period === TOTAL3) return record.totals[metric]
    return record.perYear[Number(period)][metric]
  }

  const pushLine = (label, period, records) => {
    lines.push([
      label,
      period,
      String(records.length),
      format(
        records.reduce((sum, record) => sum + record.weight, 0),
        2
      ),
      ...activeMetrics.flatMap((metric) => [
        format(
          average(records, (r) => metricValue(r, metric, period), false),
          DIGITS[metric] ?? 2
        ),
        format(
          average(records, (r) => metricValue(r, metric, period), true),
          DIGITS[metric] ?? 2
        )
      ])
    ])
  }

  const pushSeries = (label, records) => {
    for (const year of YEARS) pushLine(label, String(year), records)
    pushLine(label, MEAN3, records)
    pushLine(label, TOTAL3, records)
  }

  pushSeries(GROUPS.everyYear, buckets.everyYear)
  pushSeries(GROUPS.occasional, buckets.occasional)
  pushSeries(GROUPS.allFlyers, buckets.allFlyers)
  for (const key of ['none', 'withoutYear']) {
    pushLine(GROUPS[key], TOTAL3, buckets[key])
  }

  // Population de référence : tous les répondants retenus.
  const all = [...buckets.everyYear, ...buckets.occasional, ...buckets.none]
  for (const year of YEARS) pushLine(GROUPS.allRespondents, String(year), all)
  pushLine(GROUPS.allRespondents, MEAN3, all)
  pushLine(GROUPS.allRespondents, TOTAL3, all)

  const csv =
    (options.bom ? '\ufeff' : '') +
    lines
      .map((line) =>
        line.map((v) => csvEscape(v, options.separator)).join(options.separator)
      )
      .join('\r\n') +
    '\r\n'
  fs.writeFileSync(options.output, csv, 'utf8')

  // Colonnes affichées en console : les mêmes métriques que le CSV, avec
  // « mesure (pondéré) » dans chaque cellule.
  const CONSOLE_COLUMNS = distances
    ? [
        { metric: 'flights', header: 'vols' },
        { metric: 'courtFlights', header: 'dont court' },
        { metric: 'mlFlights', header: 'dont ML' },
        { metric: 'unallocatedFlights', header: 'non vent.' },
        { metric: 'km', header: 'km A/R' },
        { metric: 'courtKm', header: 'dont court' },
        { metric: 'mlKm', header: 'dont ML' }
      ]
    : [{ metric: 'flights', header: 'vols / pers.' }]

  const consoleRows = []
  const show = (label, period, records) =>
    consoleRows.push({
      label,
      period,
      n: records.length,
      cells: CONSOLE_COLUMNS.map(({ metric }) => {
        const cell = (weighted) =>
          format(
            average(records, (r) => metricValue(r, metric, period), weighted),
            DIGITS[metric] ?? 2
          )
        return `${cell(false)} (${cell(true)})`
      })
    })

  // Aligne l'en-tête et les valeurs sur la largeur réelle du contenu.
  const printTable = () => {
    const widths = CONSOLE_COLUMNS.map(({ header }, index) =>
      Math.max(
        header.length,
        ...consoleRows.map((row) => row.cells[index].length)
      )
    )
    // Largeurs des trois premières colonnes calculées sur le contenu réel,
    // sinon un libellé long décale toute la ligne.
    const labelWidth = Math.max(
      'population'.length,
      ...consoleRows.map((row) => row.label.length)
    )
    const periodWidth = Math.max(
      'période'.length,
      ...consoleRows.map((row) => row.period.length)
    )
    const nWidth = Math.max(
      'eff.'.length,
      ...consoleRows.map((row) => String(row.n).length)
    )
    const line = (label, period, n, cells) =>
      `  ${label.padEnd(labelWidth)} ${period.padEnd(periodWidth)} ${n.padStart(nWidth)}` +
      cells.map((cell, index) => ` | ${cell.padStart(widths[index])}`).join('')

    console.log(
      line(
        'population',
        'période',
        'eff.',
        CONSOLE_COLUMNS.map(({ header }) => header)
      )
    )
    console.log(
      line(
        '─'.repeat(labelWidth),
        '─'.repeat(periodWidth),
        '─'.repeat(nWidth),
        widths.map((width) => '─'.repeat(width))
      )
    )
    for (const row of consoleRows) {
      console.log(line(row.label, row.period, String(row.n), row.cells))
    }
  }

  // Affiche la section courante puis repart d'une table vierge : chaque
  // population a ainsi son propre en-tête de colonnes.
  const flushSection = () => {
    if (consoleRows.length > 0) printTable()
    consoleRows.length = 0
  }

  console.log(`Source      : ${path.basename(options.input)}`)
  if (options.gpOnly) console.log('Population  : cible GP uniquement')
  console.log(
    `Cadre       : ${
      options.cadre === 'personnel'
        ? 'vols personnels uniquement (défaut)'
        : options.cadre === 'professionnel'
          ? 'vols professionnels uniquement'
          : 'tous les vols, tous motifs confondus'
    }${
      options.cadre === 'tous'
        ? ''
        : ` ; trajets mixtes : ${options.mixedPolicy}`
    }`
  )
  if (!distances) {
    console.log(
      `Distances   : ${path.basename(options.distances)} introuvable, km et catégories non calculés`
    )
  }
  console.log(
    'Lecture     : moyenne par personne ; valeur = non pondéré (pondéré)'
  )
  console.log(
    'Colonnes    : vols, dont court / ML (moyen-long) courrier, non vent. = vols sans distance connue'
  )
  if (distances) {
    console.log(
      '              km A/R = total, puis répartition court / ML (moyen-long) en km'
    )
  }
  if (gpRespondents < weights.size) {
    console.log(
      `Attention   : POIDS_GP = 0 pour les ${
        weights.size - gpRespondents
      } répondants hors cible GP (GV ou NV recrutés en supplément)`
    )
    console.log(
      `              → les valeurs pondérées de l’ensemble portent sur les ${gpRespondents} répondants GP, pas sur ${weights.size}`
    )
  }
  console.log('')
  console.log('=== Personnes prenant l’avion tous les ans ===')
  for (const year of YEARS) {
    show(GROUPS.everyYear, String(year), buckets.everyYear)
  }
  show(GROUPS.everyYear, MEAN3, buckets.everyYear)
  show(GROUPS.everyYear, TOTAL3, buckets.everyYear)
  flushSection()

  console.log('')
  console.log('=== Personnes ayant volé sur 3 ans, pas tous les ans ===')
  for (const year of YEARS) {
    show(GROUPS.occasional, String(year), buckets.occasional)
  }
  show(GROUPS.occasional, MEAN3, buckets.occasional)
  show(GROUPS.occasional, TOTAL3, buckets.occasional)
  flushSection()

  console.log('')
  console.log('=== Ensemble des répondants, y compris les non-voyageurs ===')
  for (const year of YEARS) show(GROUPS.allRespondents, String(year), all)
  show(GROUPS.allRespondents, MEAN3, all)
  show(GROUPS.allRespondents, TOTAL3, all)
  flushSection()

  console.log('')
  console.log(
    `  dont ${buckets.none.length} sans aucun vol sur 3 ans, dont ${buckets.withoutYear.length} avec seulement des vols sans année`
  )
  console.log('')
  console.log(`Écrit : ${options.output}`)
}

main()
