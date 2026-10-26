// Extraction des trajets en avion du questionnaire OpinionWay / Forum Vies
// Mobiles (trois dernières années), partagée par les scripts du dossier.

export const YEARS = [2022, 2023, 2024]

const BLOCKS = [
  {
    label: 'France',
    destination: /^q8tmp_(\d+)\./,
    departure: /^q8a1a_i(\d+)\./,
    frequency: /^q8a1b_i(\d+)\./,
    year: /^q8a1e_i(\d+)\$(\d+)\./,
    purpose: /^q8a1c_i(\d+)\$(\d+)\./
  },
  {
    label: 'Étranger',
    destination: /^q10tmp_(\d+)\./,
    departure: /^q10a1a_i(\d+)\./,
    frequency: /^q10a1b_i(\d+)\./,
    year: /^q10a1f_i(\d+)\$(\d+)\./,
    purpose: /^q10a1c_i(\d+)\$(\d+)\./,
    // « Avant votre vol retour, avez-vous réalisé d'autres vols pendant votre
    // voyage à X ? » ; le nombre de vols est stocké dans le champ @othv1.
    extraFlights: /^q10a1e_i(\d+)\./,
    extraFlightsCount: /^q10a1e_i(\d+)@othv1\./
  }
]

// Motifs de vol (question q8a1c / q10a1c, choix multiple). Les codes 1, 2 et 9
// sont les seuls motifs professionnels proposés ; le code 10 (« Autres ») est
// rattaché aux motifs personnels, ses 29 réponses libres étant très
// majoritairement privées (mariage, obsèques, sport, transfert…).
export const PROFESSIONAL_PURPOSES = new Set(['1', '2', '9'])

export const PURPOSE_LABELS = {
  1: 'client/fournisseur',
  2: 'congrès/salon',
  3: 'études',
  4: 'vacances/loisirs',
  5: 'famille',
  6: 'amis',
  7: 'accompagnement',
  8: 'soins médicaux',
  9: 'autre pro',
  10: 'autre'
}

// Cadres possibles d'un trajet, tels qu'affichés dans les csv.
export const CADRES = ['personnel', 'professionnel', 'mixte', 'non renseigné']

// Répondants écartés des analyses, avec leur justification. L'exclusion est
// volontairement explicite et réversible (--no-exclude) : il s'agit d'un choix
// de traitement statistique, pas d'une correction de donnée.
//
// 711 : 19 allers-retours Marseille–Nouméa sur 2022-2024 (6/7/6, motif
//       « famille »), soit 216 066 km/an à lui seul et 8,2 % du total pondéré.
//       Réponse cohérente (trois années, trois fréquences distinctes), donc
//       conservée dans l'extraction brute ; elle est écartée des moyennes
//       parce qu'un individu ne doit pas peser 8 % d'une moyenne nationale.
export const EXCLUDED_RESPONDENTS = new Map([
  [
    '711',
    'valeur extrême : 19 A/R Marseille–Nouméa, 216 066 km/an (8,2 % du total pondéré)'
  ]
])

/**
 * Construit le prédicat d'exclusion. `exclude: false` (option --no-exclude)
 * réintègre tous les répondants ; `extra` ajoute des identifiants à la liste
 * par défaut (option --exclude).
 */
export function createExclusionFilter({ exclude = true, extra = [] } = {}) {
  if (!exclude) return () => false
  const ids = new Set([...EXCLUDED_RESPONDENTS.keys(), ...extra])
  return (id) => ids.has(id)
}

// Traitement des trajets mixtes (motifs professionnels ET personnels) :
//  - `strict`   : écartés des deux cadres, seuls les trajets exclusifs comptent ;
//  - `inclusif` : comptés dans les deux cadres (un trajet avec un motif
//                 personnel est un trajet personnel, et réciproquement).
// `strict` est le défaut : la fréquence n'existant qu'une fois par trajet, un
// trajet mixte ne peut pas être réparti entre les deux cadres, donc on préfère
// ne pas trancher.
export const MIXED_POLICIES = ['strict', 'inclusif']

/**
 * Cadre d'un trajet d'après ses motifs déclarés. La fréquence n'existe qu'une
 * fois par trajet : un trajet mixte ne peut donc pas être scindé en vols
 * professionnels et vols personnels.
 */
export function classifyTrip(trip) {
  const motifs = trip.motifs ?? []
  if (motifs.length === 0) return 'non renseigné'
  const professional = motifs.some((code) => PROFESSIONAL_PURPOSES.has(code))
  const personal = motifs.some((code) => !PROFESSIONAL_PURPOSES.has(code))
  if (professional && personal) return 'mixte'
  return professional ? 'professionnel' : 'personnel'
}

/** Vrai si le trajet entre dans le cadre demandé (`tous` les accepte tous). */
export function matchesCadre(trip, cadre, mixedPolicy = 'strict') {
  if (cadre === 'tous') return true
  const kind = classifyTrip(trip)
  if (kind === cadre) return true
  return kind === 'mixte' && mixedPolicy === 'inclusif'
}

/** Motifs lisibles, pour les colonnes csv. */
export function tripPurposeLabels(trip) {
  return (trip.motifs ?? []).map((code) => PURPOSE_LABELS[code] ?? code)
}

export const isEmpty = (value) =>
  value === undefined ||
  value === null ||
  String(value).trim() === '' ||
  String(value).trim() === '0'

export const toNumber = (value) => {
  if (isEmpty(value)) return null
  const number = Number(String(value).replace(',', '.'))
  return Number.isFinite(number) ? number : null
}

function indexColumns(header) {
  const idIndex = header.findIndex(
    (name) => (name ?? '').trim().toUpperCase() === 'ID SIMPLE'
  )
  if (idIndex === -1) throw new Error('Colonne "ID SIMPLE" introuvable')

  return BLOCKS.map((block) => {
    const byDestination = new Map()
    const byDeparture = new Map()
    const byFrequency = new Map()
    const byYear = new Map()
    const byPurpose = new Map()
    const byExtraFlights = new Map()
    const byExtraFlightsCount = new Map()

    header.forEach((name, index) => {
      if (!name) return
      let match

      if ((match = block.destination.exec(name))) {
        byDestination.set(Number(match[1]), index)
      } else if ((match = block.departure.exec(name))) {
        byDeparture.set(Number(match[1]), index)
      } else if ((match = block.frequency.exec(name))) {
        byFrequency.set(Number(match[1]), index)
      } else if ((match = block.purpose?.exec(name))) {
        const voyage = Number(match[1])
        if (!byPurpose.has(voyage)) byPurpose.set(voyage, [])
        byPurpose.get(voyage).push({ code: match[2], index })
      } else if (
        block.extraFlightsCount &&
        (match = block.extraFlightsCount.exec(name))
      ) {
        byExtraFlightsCount.set(Number(match[1]), index)
      } else if (
        block.extraFlights &&
        (match = block.extraFlights.exec(name))
      ) {
        byExtraFlights.set(Number(match[1]), index)
      } else if ((match = block.year.exec(name))) {
        const voyage = Number(match[1])
        const year = YEARS[Number(match[2]) - 1]
        if (year === undefined) return
        if (!byYear.has(voyage)) byYear.set(voyage, new Map())
        byYear.get(voyage).set(year, index)
      }
    })

    // Le créneau de destination est 0-based (`q8tmp_0`) alors que les blocs
    // départ / fréquence / année sont 1-based (`q8a1a_i1` = « Voyage vu en 1 »).
    const slots = [...byDestination.keys()].sort((a, b) => a - b)
    const maxVoyage = Math.max(0, ...byDeparture.keys(), ...byFrequency.keys())

    return {
      ...block,
      idIndex,
      byDestination,
      byDeparture,
      byFrequency,
      byYear,
      byPurpose,
      byExtraFlights,
      byExtraFlightsCount,
      slots,
      maxVoyage
    }
  })
}

function extractTrips(row, block) {
  const trips = []

  // On parcourt l'union des créneaux connus : la liste de destinations va
  // jusqu'à 15 entrées, les questions de détail seulement jusqu'à 10.
  const maxSlot = Math.max(block.slots.at(-1) ?? -1, block.maxVoyage - 1)
  for (let slot = 0; slot <= maxSlot; slot++) {
    const voyage = slot + 1
    const destination = row[block.byDestination.get(slot)] ?? null
    const departure = row[block.byDeparture.get(voyage)] ?? null
    const frequency = toNumber(row[block.byFrequency.get(voyage)])
    const yearColumns = block.byYear.get(voyage)

    const years = yearColumns
      ? YEARS.filter((year) => {
          const index = yearColumns.get(year)
          return index !== undefined && !isEmpty(row[index])
        })
      : []

    // Vols internes au voyage (ex. Bangkok → Chiang Mai pendant un séjour en
    // Thaïlande) : question posée seulement pour l'étranger, et distincte de
    // l'aller/retour compté par la fréquence.
    const extraFlightsAnswer = row[block.byExtraFlights.get(voyage)]
    const hasExtraFlights =
      typeof extraFlightsAnswer === 'string' &&
      extraFlightsAnswer.trim().toLowerCase().startsWith('oui')
    const extraFlights = hasExtraFlights
      ? (toNumber(row[block.byExtraFlightsCount.get(voyage)]) ?? 0)
      : 0

    // Motifs du vol (choix multiple). Une case vide ou à 0 n'est pas cochée.
    const motifs = (block.byPurpose.get(voyage) ?? [])
      .filter(({ index }) => !isEmpty(row[index]))
      .map(({ code }) => code)

    if (
      isEmpty(destination) &&
      isEmpty(departure) &&
      frequency === null &&
      years.length === 0 &&
      extraFlights === 0 &&
      motifs.length === 0
    ) {
      continue
    }

    trips.push({
      portee: block.label,
      voyage,
      arrival: isEmpty(destination) ? null : destination.trim(),
      departure: isEmpty(departure) ? null : departure.trim(),
      frequency,
      extraFlights,
      years,
      motifs
    })
  }

  return trips
}

/**
 * Parcourt la feuille et renvoie un enregistrement par répondant :
 * { id, trips } où chaque trajet porte ses années et ses vols internes.
 * `tripCount` compte les vols vers la destination (hors vols internes).
 */
export function extractRespondents(rows) {
  const header = (rows[0] ?? []).map((value) =>
    value === undefined || value === null ? null : value.trim()
  )
  const blocks = indexColumns(header)
  const idIndex = blocks[0].idIndex

  const respondents = []
  for (const row of rows.slice(1)) {
    const id = (row[idIndex] ?? '').trim()
    if (id === '') continue
    respondents.push({
      id,
      trips: blocks.flatMap((block) => extractTrips(row, block))
    })
  }

  return respondents
}

// Les années sont parcourues de la plus récente à la plus ancienne. Le
// curseur de répartition ne repart pas de zéro à chaque trajet : il continue
// là où le trajet précédent s'est arrêté, y compris d'un répondant au suivant,
// ce qui équilibre les vols entre les années sur l'ensemble du fichier.
const YEAR_ORDER = [...YEARS].sort((a, b) => b - a)

/**
 * Crée un allocateur à curseur persistant. Un seul allocateur doit être utilisé
 * pour tout un fichier : le curseur traverse les trajets et les répondants dans
 * l'ordre de lecture, et n'est jamais réinitialisé.
 *
 * `allocate(trips)` renvoie les trajets enrichis d'une `allocation`
 * (Map année → nombre de vols), dont la somme égale la fréquence déclarée.
 *
 * Exemples (curseur repartant de la plus récente) :
 *   4 vols sur 2022-2024 → 2024:2, 2023:1, 2022:1, curseur suivant 2023
 *   2 vols sur 2022-2024 → 2023:1, 2022:1, 2024:0
 *   5 vols sur 2022+2024 → 2024:3, 2022:2
 */
export function createYearAllocator() {
  let cursor = null

  return {
    get cursor() {
      return cursor
    },
    reset() {
      cursor = null
    },
    allocate(trips) {
      return trips.map((trip) => {
        if (trip.years.length === 0) {
          return { ...trip, allocation: null }
        }

        const ordered = [...trip.years].sort((a, b) => b - a)
        let start = 0
        if (cursor !== null) {
          const cursorPosition = YEAR_ORDER.indexOf(cursor)
          const found = ordered.findIndex(
            (year) => YEAR_ORDER.indexOf(year) >= cursorPosition
          )
          start = found === -1 ? 0 : found
        }

        const total = Math.round(trip.frequency ?? 0)
        const allocation = new Map(ordered.map((year) => [year, 0]))
        let last = ordered[start]
        for (let index = 0; index < total; index++) {
          const year = ordered[(start + index) % ordered.length]
          allocation.set(year, allocation.get(year) + 1)
          last = year
        }
        if (total > 0) {
          cursor =
            YEAR_ORDER[(YEAR_ORDER.indexOf(last) + 1) % YEAR_ORDER.length]
        }

        return { ...trip, allocation }
      })
    }
  }
}

/** Répartit les trajets d'un seul répondant (curseur neuf). */
export function allocateTripsByYear(trips) {
  return createYearAllocator().allocate(trips)
}

// Découpe un trajet en blocs de colonnes, un par année cochée, avec la
// fréquence répartie par `allocateTripsByYear`. `--merge-years` conserve les
// années dans une seule cellule et la fréquence totale. Les vols internes au
// voyage sont rattachés au premier bloc seulement : ils décrivent le voyage
// lui-même, pas une année, et les répéter fausserait la somme de la colonne.
export function expandTripYears(trip, mergeYears) {
  if (mergeYears || trip.years.length === 0) return [trip]

  return [...trip.years]
    .sort((a, b) => a - b)
    .map((year, position) => ({
      ...trip,
      years: [year],
      frequency: trip.allocation?.get(year) ?? 0,
      extraFlights: position === 0 ? trip.extraFlights : 0
    }))
}

export function csvEscape(value, separator) {
  const text = value === null || value === undefined ? '' : String(value)
  if (text.includes(separator) || text.includes('"') || /[\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function formatCsv(rows, separator) {
  return rows
    .map((row) =>
      row.map((value) => csvEscape(value, separator)).join(separator)
    )
    .join('\r\n')
}
