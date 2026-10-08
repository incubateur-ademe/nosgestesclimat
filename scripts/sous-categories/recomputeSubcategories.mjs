/**
 * Recalcule les nouvelles « sous catégories » (data/ui/subcategories.publicodes)
 * pour chaque simulation stockée en base, et exporte le résultat dans un CSV.
 *
 * Le CSV produit est directement consommable par `customSubcategories.mjs`
 * (calcul des postes de `ravijen.yaml`, `page-de-fin.yaml`…) : le format est
 * défini une fois pour toutes dans `lib/csv.mjs` et `lib/subcategories.mjs`,
 * partagés avec `recomputeSubCategoriesForPersonas.mjs`.
 *
 * Pour chaque simulation :
 *   1. on récupère les règles de la version du modèle associée à la simulation
 *      (publiée sur npm, via getRulesFromPreviousRelease) ;
 *   2. on ajoute les règles de sous catégories ;
 *   3. on instancie un moteur Publicodes (mis en cache par version de modèle) ;
 *   4. on applique la situation de la simulation (setSituation) ;
 *   5. on évalue chacune des règles de sous catégories ;
 *   6. on arrondit les résultats au dixième et on vérifie que
 *      `bilan . sous catégories` est égal à `bilan`, sinon on flague la
 *      simulation.
 *
 * Les simulations dont le modèle est une version de prévisualisation
 * (`FR-fr-pr-2824`, `rc`, `beta`…) sont ignorées : ces versions ne sont pas
 * publiées sur npm, leurs règles sont donc introuvables.
 *
 * ## Compatibilité des règles selon la version du modèle
 *
 * Le modèle évolue : certaines règles de sous catégories n'existent que dans les
 * versions récentes. Le catalogue `RULES_SETS` associe à chaque plage de
 * versions le ou les fichiers à charger. Les simulations dont la version ne
 * tombe dans aucune plage sont ignorées (raison « version non supportée »),
 * jamais comptées comme erreurs.
 *
 * Les fichiers d'une même plage sont fusionnés dans l'ordre : le premier définit
 * la structure, les suivants surchargent certaines règles. Les fichiers de
 * surcharge ne doivent **pas** introduire de nouvelles règles, sinon les
 * colonnes du CSV changeraient d'une version à l'autre.
 *
 * Le CSV et le checkpoint sont toujours écrits dans le dossier de ce script
 * (sauf chemin absolu explicitement fourni via `--output`).
 *
 * Le script écrit le CSV au fur et à mesure (un lot à la fois) et sauvegarde un
 * checkpoint (`<output>.checkpoint.json`) après chaque lot. Si le script est
 * interrompu, il reprend automatiquement au lot suivant grâce au flag `--from`.
 *
 * Usage:
 *   node scripts/sous-categories/recomputeSubcategories.mjs [options]
 *     -o, --output     Nom du CSV de sortie (résolu dans le dossier du script,
 *                      default: sous-categories.csv)
 *     -b, --batch      Taille des batchs (default: 50)
 *     -u, --url        URL Postgres (default: postgresql://postgres:postgres@localhost:5432/ngc)
 *     -s, --schema     Schéma Postgres (default: ngc)
 *     -r, --rules      Force un fichier de règles unique pour toutes les
 *                      versions (au lieu du catalogue RULES_SETS)
 *         --start-date Début de la période analysée, inclus (date 'YYYY-MM-DD'
 *                      ou timestamp ISO). Pas de borne si omis
 *         --end-date   Fin de la période analysée. Une date 'YYYY-MM-DD' inclut
 *                      la journée entière ; un timestamp ISO est exclu (borne
 *                      supérieure stricte). Pas de borne si omis
 *     -f, --from       Reprise : 'auto' (depuis le checkpoint), '0' / 'all'
 *                      (repart de zéro) ou une date 'YYYY-MM-DD' (équivaut à
 *                      `--start-date`). Default: auto
 *         --recompute-incoherent
 *                      Recalcule uniquement les simulations flaguées
 *                      incohérentes du checkpoint et remplace leurs lignes dans
 *                      le CSV (à utiliser après une correction des règles)
 *     -v, --verbose    Affiche le détail par simulation
 *
 * Exemples:
 *   # Analyse du mois de septembre 2026 (base locale ou via tunnel SSH)
 *   node scripts/sous-categories/recomputeSubcategories.mjs \
 *     --start-date 2026-09-01 --end-date 2026-09-30 \
 *     --output sous-categories-2026-09.csv --url "$DATABASE_URL"
 *
 *   # Après correction des règles : ne retraiter que les lignes flaguées
 *   node scripts/sous-categories/recomputeSubcategories.mjs \
 *     --output sous-categories-2026-09-prod.csv --recompute-incoherent
 *
 *   node scripts/sous-categories/recomputeSubcategories.mjs --from 0
 *   node scripts/sous-categories/recomputeSubcategories.mjs   # reprend si interrompu
 */

import Engine from 'publicodes'
import { execFileSync } from 'node:child_process'
import { appendFile, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import yargs from 'yargs'
import c from 'ansi-colors'
import { getModelFromSource } from '@publicodes/tools/compilation'

import { getRulesFromPreviousRelease } from '../../tests/commons.mjs'
import { DELIMITER } from './lib/csv.mjs'
import {
  SUB_CATEGORIES_ROOT,
  buildCsvHeader,
  buildCsvLine,
  engineOptions,
  isEmptyRule,
  roundToTenth,
  toNumber
} from './lib/subcategories.mjs'

// Le script vit dans `<repo>/scripts/sous-categories`.
const SCRIPT_DIR = import.meta.dirname
// Racine du dépôt (deux niveaux au-dessus), utilisée pour résoudre les chemins
// relatifs comme `data/ui/subcategories.publicodes`.
const REPO_DIR = path.resolve(SCRIPT_DIR, '..', '..')

/// ---------------------- Règles par version ----------------------

/** Fichier de base : il définit la structure (et donc les colonnes du CSV). */
const BASE_RULES_FILE = 'data/ui/subcategories.publicodes'

/**
 * Catalogue des jeux de règles, par plage de versions du modèle.
 *
 * Chaque entrée :
 *   - `min`          : version minimale, incluse ;
 *   - `maxExclusive` : version maximale, exclue (`null` = pas de borne) ;
 *   - `files`        : fichiers à fusionner, dans l'ordre. Le premier est le
 *     fichier de base, les suivants surchargent des règles existantes.
 *
 * Une version qui ne tombe dans aucune plage est ignorée.
 */
const RULES_SETS = [
  {
    min: '4.16.0',
    maxExclusive: null,
    files: [BASE_RULES_FILE]
  },
  {
    // Le petit déjeuner a été refondu en 4.16.0 : avant, c'est un profil agrégé
    // (`type`), après, des composants (`tartine`, `charcuterie`…).
    // `files[1]` réexprime `portion carné / lacté / sucré` à partir des profils.
    // Borne basse : 4.10.5 (en dessous, d'autres règles du modèle manquent).
    min: '4.10.5',
    maxExclusive: '4.16.0',
    files: [BASE_RULES_FILE, 'data/ui/subcategories.avant-4.16.0.yaml']
  }
]

/** Compare deux versions `X.Y.Z`. */
const compareVersions = (a, b) => {
  const pa = String(a).split('.').map(Number)
  const pb = String(b).split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const x = pa[i] ?? 0
    const y = pb[i] ?? 0
    if (x !== y) return x - y
  }
  return 0
}

/** Vrai si `version` appartient à la plage `{ min, maxExclusive }`. */
const isVersionInRange = (version, { min, maxExclusive }) =>
  compareVersions(version, min) >= 0 &&
  (maxExclusive == null || compareVersions(version, maxExclusive) < 0)

/** Jeu de règles applicable à une version, ou `null` si non supportée. */
const getRulesSet = (version) =>
  RULES_SETS.find((set) => isVersionInRange(version, set)) ?? null

/**
 * Charge (et met en cache) les règles de sous catégories applicables à une
 * version : fusion des fichiers du jeu de règles correspondant.
 *
 * La fusion suit l'ordre de `files` : le fichier de base d'abord, puis les
 * surcharges.
 */
const rulesBySetCache = new Map()
function getSubcategoryRulesForVersion(version) {
  const set = getRulesSet(version)
  if (!set) return null

  const key = set.files.join('|')
  if (!rulesBySetCache.has(key)) {
    const merged = {}
    for (const file of set.files) {
      Object.assign(merged, getModelFromSource([path.resolve(REPO_DIR, file)]))
    }
    rulesBySetCache.set(key, merged)
  }
  return rulesBySetCache.get(key)
}

/// ---------------------- Arguments ----------------------

const argv = yargs(process.argv.slice(2))
  .version(false)
  .usage(
    'Recalcule les sous catégories pour toutes les simulations en base\n\nUsage: $0 [options]'
  )
  .option('output', {
    alias: 'o',
    type: 'string',
    description: 'Nom du CSV de sortie (résolu dans le dossier du script)',
    default: 'sous-categories.csv'
  })
  .option('batch', {
    alias: 'b',
    type: 'number',
    description: 'Taille des batchs',
    default: 50
  })
  .option('url', {
    alias: 'u',
    type: 'string',
    description: 'URL de connexion Postgres',
    default: 'postgresql://postgres:postgres@localhost:5432/ngc'
  })
  .option('schema', {
    alias: 's',
    type: 'string',
    description: 'Schéma Postgres',
    default: 'ngc'
  })
  .option('rules', {
    alias: 'r',
    type: 'string',
    description:
      'Force un fichier de règles unique pour toutes les versions (relatif à la racine du dépôt), au lieu du catalogue RULES_SETS'
  })
  .option('start-date', {
    type: 'string',
    description:
      "Début de la période analysée, inclus (date 'YYYY-MM-DD' ou timestamp ISO)"
  })
  .option('end-date', {
    type: 'string',
    description:
      "Fin de la période analysée (date 'YYYY-MM-DD' incluse, timestamp ISO exclu)"
  })
  .option('from', {
    alias: 'f',
    type: 'string',
    description:
      "Reprise : 'auto' (depuis le checkpoint), '0' / 'all' (repart de zéro) ou une date 'YYYY-MM-DD' (équivaut à --start-date)",
    default: 'auto'
  })
  .option('recompute-incoherent', {
    type: 'boolean',
    description:
      'Recalcule uniquement les simulations flaguées incohérentes du checkpoint et remplace leurs lignes dans le CSV (utile après correction des règles)',
    default: false
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Affiche le détail par simulation'
  })
  .help('h')
  .alias('h', 'help').argv

const {
  output,
  batch,
  url,
  schema,
  rules,
  from,
  startDate: startDateArg,
  endDate: endDateArg,
  recomputeIncoherent,
  verbose
} = argv

// `--rules` force un fichier unique pour toutes les versions ; par défaut, on
// utilise le catalogue `RULES_SETS`.
const forcedRulesFile = rules
  ? path.isAbsolute(rules)
    ? rules
    : path.resolve(REPO_DIR, rules)
  : null

// Clé identifiant la configuration de règles : sert au garde-fou du checkpoint
// (reprendre un CSV produit avec une autre configuration n'aurait pas de sens).
const rulesSetKey = forcedRulesFile
  ? `forced:${forcedRulesFile}`
  : JSON.stringify(RULES_SETS)

// Les sorties sont toujours résolues dans le dossier du script, sauf si un
// chemin absolu est explicitement fourni.
const outputPath = path.isAbsolute(output)
  ? output
  : path.join(SCRIPT_DIR, output)

/// ---------------------- Helpers ----------------------

/**
 * Récupère un batch de simulations depuis Postgres, triées par `date` (et `id`
 * pour départager les dates identiques). Utilise une pagination "keyset" pour
 * rester stable même si des simulations sont insérées pendant l'exécution.
 *
 * - `lastDate` / `lastId` : curseur de reprise (reprend juste après cette ligne) ;
 * - `startDate` : borne inférieure incluse ;
 * - `endDate` : borne supérieure (exclusive pour un timestamp, journée entière
 *   incluse pour une date `YYYY-MM-DD` — la conversion est faite en amont).
 */
function fetchSimulationBatch({ lastDate, lastId, startDate, endDate, limit }) {
  const conditions = []
  if (lastDate && lastId) {
    conditions.push(`(date, id) > (timestamp '${lastDate}', '${lastId}'::uuid)`)
  } else if (startDate) {
    conditions.push(`date >= timestamp '${startDate}'`)
  }
  if (endDate) {
    conditions.push(`date < timestamp '${endDate}'`)
  }
  const where = conditions.length > 0 ? `where ${conditions.join(' and ')}` : ''
  const query = `
    select coalesce(json_agg(t), '[]') from (
      select id, date, model, progression, situation
      from ${schema}."Simulation"
      ${where}
      order by date, id
      limit ${limit}
    ) t;
  `
  const stdout = execFileSync('psql', [url, '-t', '-A', '-c', query], {
    maxBuffer: 1024 * 1024 * 200
  }).toString()
  return JSON.parse(stdout)
}

/**
 * Récupère des simulations par identifiant (utilisé par le mode
 * `--recompute-incoherent`).
 */
function fetchSimulationsByIds(ids) {
  const list = ids.map((id) => `'${id}'::uuid`).join(', ')
  const query = `
    select coalesce(json_agg(t), '[]') from (
      select id, date, model, progression, situation
      from ${schema}."Simulation"
      where id in (${list})
    ) t;
  `
  const stdout = execFileSync('psql', [url, '-t', '-A', '-c', query], {
    maxBuffer: 1024 * 1024 * 200
  }).toString()
  return JSON.parse(stdout)
}

/// ---------------------- Moteurs ----------------------

const rulesCache = new Map()
const engineCache = new Map()

/** Télécharge (et met en cache) les règles d'une version publiée du modèle. */
async function getPreviousRules(version) {
  if (!rulesCache.has(version)) {
    rulesCache.set(version, await getRulesFromPreviousRelease(version))
  }
  return rulesCache.get(version)
}

/** Instancie (et met en cache) un moteur par version de modèle. */
async function getEngine(version, rules) {
  if (!engineCache.has(version)) {
    const baseRules = await getPreviousRules(version)
    engineCache.set(
      version,
      new Engine({ ...baseRules, ...rules }, engineOptions)
    )
  }
  return engineCache.get(version)
}

/** Règles de sous catégories applicables à une version du modèle. */
const getSubcategoryRules = (version) =>
  forcedRulesFile
    ? getForcedRules(forcedRulesFile)
    : getSubcategoryRulesForVersion(version)

const forcedRulesCache = new Map()
function getForcedRules(file) {
  if (!forcedRulesCache.has(file)) {
    forcedRulesCache.set(file, getModelFromSource([file]))
  }
  return forcedRulesCache.get(file)
}

/** Extrait la version du modèle depuis le champ `model` (ex. FR-fr-4.17.0). */
const getVersionFromModel = (model) => model.split('-').slice(2).join('-')

/**
 * Une version publiée sur npm a la forme `X.Y.Z`.
 *
 * Toute autre valeur correspond à une version de prévisualisation — `pr-2824`
 * (packages éphémères `pkg-pr-new`, publiés hors registre npm), `rc.1`, `beta`…
 * — pour laquelle `getRulesFromPreviousRelease` ne peut que renvoyer un 404.
 * Ces simulations sont ignorées volontairement, pas comptées comme erreurs.
 */
const RELEASE_VERSION_RE = /^\d+\.\d+\.\d+$/
const isPublishedVersion = (version) => RELEASE_VERSION_RE.test(version)

/// ---------------------- Checkpoint ----------------------

const checkpointPath = `${outputPath}.checkpoint.json`

/** Lit le checkpoint s'il existe, sinon `null`. */
async function readCheckpoint() {
  try {
    return JSON.parse(await readFile(checkpointPath, 'utf8'))
  } catch {
    return null
  }
}

/** Sauvegarde l'état d'avancement (après chaque batch). */
async function writeCheckpoint(state) {
  await writeFile(checkpointPath, JSON.stringify(state, null, 2))
}

/** Vérifie que le CSV existe déjà (pour ne pas réécrire l'entête). */
async function csvExists() {
  try {
    await readFile(outputPath)
    return true
  } catch {
    return false
  }
}

/// ---------------------- Calcul d'une simulation ----------------------

/**
 * Calcule la ligne CSV d'une simulation.
 *
 * @returns `{ line, isCoherent, bilanRounded, bilanSubcategoriesRounded }`, ou
 *   `null` si la version du modèle n'est pas supportée.
 */
async function computeSimulationRow(simulation, version) {
  const rules = getSubcategoryRules(version)
  if (rules == null) return null

  const engine = await getEngine(version, rules)
  engine.setSituation(simulation.situation)

  const bilan = toNumber(engine.evaluate('bilan').nodeValue)
  const bilanSubcategories = toNumber(
    engine.evaluate(SUB_CATEGORIES_ROOT).nodeValue
  )

  // Les résultats sont arrondis au dixième avant la comparaison.
  const bilanRounded = roundToTenth(bilan)
  const bilanSubcategoriesRounded = roundToTenth(bilanSubcategories)
  const isCoherent = bilanSubcategoriesRounded === bilanRounded

  const values = {}
  for (const subcategory of subcategories) {
    values[subcategory] = roundToTenth(
      toNumber(engine.evaluate(subcategory).nodeValue)
    )
  }

  const line = buildCsvLine(
    {
      id: simulation.id,
      date: simulation.date,
      progression: simulation.progression,
      bilan: bilanRounded,
      isCoherent
    },
    subcategories,
    values
  )

  return { line, isCoherent, bilanRounded, bilanSubcategoriesRounded }
}

/**
 * Recalcule uniquement les simulations flaguées incohérentes dans le checkpoint
 * et remplace leurs lignes dans le CSV existant (les autres lignes sont
 * conservées telles quelles).
 *
 * Utile après une correction des règles de sous catégories : inutile de
 * retraiter l'intégralité des simulations.
 */
async function recomputeIncoherentSimulations() {
  const checkpoint = await readCheckpoint()
  if (!checkpoint) {
    console.error(
      `${c.red('✘')} Aucun checkpoint trouvé (${checkpointPath}). ` +
        `Lance d'abord une analyse complète.`
    )
    process.exit(1)
  }

  const targets = checkpoint.incoherent ?? []
  if (targets.length === 0) {
    console.log(
      `${c.green('✔')} Aucune simulation incohérente dans le checkpoint, rien à recalculer.`
    )
    return
  }

  console.log(
    `♻️  Recalcul de ${targets.length} simulation(s) incohérente(s)…\n`
  )

  const simulations = fetchSimulationsByIds(targets.map(({ id }) => id))
  const foundIds = new Set(simulations.map(({ id }) => id))
  const missingIds = targets
    .map(({ id }) => id)
    .filter((id) => !foundIds.has(id))

  const targetsById = new Map(targets.map((target) => [target.id, target]))

  const newLinesById = new Map()
  // Simulations toujours incohérentes après recalcul OU qui n'ont pas pu être
  // recalculées : elles restent flaguées dans le checkpoint, sinon elles
  // seraient perdues silencieusement lors d'un prochain passage ciblé.
  const stillIncoherent = []

  for (const simulation of simulations) {
    const version = getVersionFromModel(simulation.model)
    const label = `${simulation.id} (${simulation.model})`

    const keepIncoherent = (reason) => {
      stillIncoherent.push(targetsById.get(simulation.id))
      console.log(
        `${c.dim('⏭')} ${label} : ${reason}, conservée comme incohérente`
      )
    }

    if (!isPublishedVersion(version)) {
      keepIncoherent('version non publiée')
      continue
    }

    try {
      const row = await computeSimulationRow(simulation, version)
      if (row == null) {
        keepIncoherent('version non supportée')
        continue
      }

      const { line, isCoherent, bilanRounded, bilanSubcategoriesRounded } = row
      newLinesById.set(simulation.id, line)

      if (isCoherent) {
        console.log(
          `${c.green('✔')} ${label} : désormais cohérente (${bilanRounded})`
        )
      } else {
        stillIncoherent.push({
          id: simulation.id,
          version,
          bilan: bilanRounded,
          bilanSubcategories: bilanSubcategoriesRounded
        })
        console.log(
          `${c.red('✘')} ${label} : toujours incohérente ` +
            `(bilan=${bilanRounded}, sous-catégories=${bilanSubcategoriesRounded})`
        )
      }
    } catch (error) {
      keepIncoherent(`erreur de calcul (${error.message})`)
    }
  }

  // Les cibles absentes de la base restent incohérentes (rien n'a pu être
  // recalculé pour elles).
  for (const id of missingIds) {
    stillIncoherent.push(targetsById.get(id))
  }

  // Réécriture du CSV : on remplace les lignes ciblées, on garde les autres.
  const csvText = await readFile(outputPath, 'utf8')
  const csvLines = csvText.split('\n')
  const trailingNewline = csvText.endsWith('\n')
  const [csvHeader, ...csvRows] = csvLines.filter(
    (line, index) => line !== '' || index === 0
  )

  let replaced = 0
  const rewritten = csvRows.map((line) => {
    const id = line.slice(0, line.indexOf(DELIMITER))
    if (newLinesById.has(id)) {
      replaced++
      return newLinesById.get(id)
    }
    return line
  })

  await writeFile(
    outputPath,
    [csvHeader, ...rewritten].join('\n') + (trailingNewline ? '\n' : '')
  )

  // Le checkpoint ne conserve que les simulations encore incohérentes.
  await writeCheckpoint({
    ...checkpoint,
    incoherent: stillIncoherent,
    updatedAt: new Date().toISOString()
  })

  console.log(
    `\n✅ ${replaced} ligne(s) remplacée(s) dans ${c.bold(outputPath)}`
  )

  if (replaced === 0) {
    console.log(
      `\n${c.yellow('⚠️  Aucune ligne n’a pu être recalculée : les simulations ciblées sont introuvables dans cette base.')}`
    )
    console.log(
      `   Vérifie le tunnel / l'URL (--url) : ces simulations appartiennent à la base utilisée lors du run initial.`
    )
  } else if (stillIncoherent.length === 0) {
    console.log(
      `\n${c.green('✔')} Les ${replaced} simulation(s) recalculée(s) sont désormais cohérentes`
    )
  } else {
    console.log(
      `\n${c.yellow(`${stillIncoherent.length} simulation(s) restent incohérente(s)`)}`
    )
  }

  if (missingIds.length > 0) {
    console.log(
      `\n${c.yellow(`⚠️  ${missingIds.length} simulation(s) introuvable(s) en base :`)}`
    )
    for (const id of missingIds) console.log(`   ${id}`)
  }
}

/// ---------------------- Main ----------------------

// Les colonnes du CSV sont définies par le fichier de base : les fichiers de
// surcharge ne doivent introduire aucune règle supplémentaire, sinon les
// colonnes dépendraient de la version du modèle.
const baseRulesForColumns = getModelFromSource([
  path.resolve(REPO_DIR, BASE_RULES_FILE)
])

// Toutes les règles « évaluables » du fichier de base, dans l'ordre de
// déclaration.
const allSubcategories = Object.keys(baseRulesForColumns)
const subcategories = allSubcategories.filter(
  (name) => !isEmptyRule(baseRulesForColumns[name])
)
const emptySubcategories = allSubcategories.filter((name) =>
  isEmptyRule(baseRulesForColumns[name])
)

// Garde-fou : un fichier de surcharge qui ajoute une règle ferait varier les
// colonnes du CSV selon la version du modèle.
for (const set of RULES_SETS) {
  if (set.files.length < 2) continue
  for (const file of set.files.slice(1)) {
    const extra = Object.keys(
      getModelFromSource([path.resolve(REPO_DIR, file)])
    ).filter((name) => !allSubcategories.includes(name))
    if (extra.length > 0) {
      console.error(
        `${c.red('✘')} ${file} introduit des règles absentes du fichier de base :\n` +
          extra.map((n) => `   + ${n}`).join('\n') +
          `\n   Les fichiers de surcharge ne doivent que redéfinir des règles existantes.`
      )
      process.exit(1)
    }
  }
}

/// ---------------------- Plage de dates ----------------------

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
// L'offset (Z ou ±hh:mm) est obligatoire : sans lui, l'instant dépendrait du
// fuseau du serveur et les bornes de période seraient inattendues.
const ISO_RE =
  /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:?\d{2})$/

/** Vrai si la date `YYYY-MM-DD` existe réellement (ex. rejette 2026-02-30). */
const isValidDateOnly = (value) => {
  if (!DATE_RE.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  )
}

/** Vrai si le timestamp ISO est valide et non ambigu (offset explicite). */
const isValidTimestamp = (value) => {
  if (!ISO_RE.test(value)) {
    // Un timestamp sans offset est ambigu (dépend du fuseau du serveur) : on le
    // refuse pour éviter des bornes de période inattendues.
    return false
  }
  return !Number.isNaN(Date.parse(value.replace(' ', 'T')))
}

/**
 * Normalise une borne de date fournie par l'utilisateur en timestamp « naïf »
 * (`YYYY-MM-DD HH:MM:SS`), tel que stocké dans `Simulation.date`.
 *
 * ⚠️ `Simulation.date` est de type `timestamp without time zone`. Comparer des
 * bornes naïves à une colonne naïve est **indépendant du fuseau** de session :
 * l'ordre des valeurs reste identique, que la colonne contienne de l'UTC ou de
 * l'heure de Paris. Les bornes « date seule » sont donc non ambiguës.
 *
 * - une date `YYYY-MM-DD` devient minuit, ou le début du jour suivant si
 *   `endExclusive` (ce qui inclut toute la journée de fin) ;
 * - un timestamp ISO avec offset est converti en UTC (instant explicite).
 */
function normalizeBoundary(value, { endExclusive = false } = {}) {
  const raw = String(value).trim()

  if (DATE_RE.test(raw)) {
    if (!isValidDateOnly(raw)) {
      throw new Error(`Date inexistante : "${raw}"`)
    }
    let day = raw
    if (endExclusive) {
      const next = new Date(`${raw}T00:00:00Z`)
      next.setUTCDate(next.getUTCDate() + 1)
      day = next.toISOString().slice(0, 10)
    }
    return `${day} 00:00:00`
  }

  if (isValidTimestamp(raw)) {
    return new Date(raw.replace(' ', 'T'))
      .toISOString()
      .slice(0, 19)
      .replace('T', ' ')
  }

  throw new Error(
    `Format de date invalide : "${raw}". Attendu 'YYYY-MM-DD' ou un timestamp ISO avec offset.`
  )
}

// Interprétation des flags `--start-date`, `--end-date` et `--from`.
const fromArg = String(from).trim()
const fromArgLower = fromArg.toLowerCase()

let resume = false
let startDate = null
let endDate = null

try {
  if (fromArgLower === 'auto') {
    resume = true
  } else if (fromArgLower === '0' || fromArgLower === 'all') {
    resume = false
  } else if (isValidDateOnly(fromArg)) {
    startDate = normalizeBoundary(fromArg)
  } else {
    throw new Error(
      `Valeur invalide pour --from : "${fromArg}". ` +
        `Attendu : 'auto', '0', 'all' ou une date 'YYYY-MM-DD'.`
    )
  }

  // `--start-date` / `--end-date` prévalent sur `--from` lorsqu'ils sont fournis.
  if (startDateArg != null) startDate = normalizeBoundary(startDateArg)
  if (endDateArg != null) {
    endDate = normalizeBoundary(endDateArg, { endExclusive: true })
  }

  if (startDate && endDate && startDate >= endDate) {
    throw new Error(
      `Plage invalide : --start-date (${startDateArg}) doit être antérieure à --end-date (${endDateArg}) ` +
        `(bornes résolues : ${startDate} → ${endDate}, borne haute exclue).`
    )
  }
} catch (error) {
  console.error(`${c.red('✘')} ${error.message}`)
  process.exit(1)
}

/// ---------------------- Checkpoint ----------------------

const checkpoint = resume ? await readCheckpoint() : null

// Garde-fou (mode parcours complet uniquement) : reprendre un checkpoint produit
// avec une autre plage de dates ou une autre configuration de règles conduirait
// à un CSV incohérent.
//
// Ce contrôle est volontairement désactivé en mode `--recompute-incoherent` :
// ce mode sert précisément à retraiter les lignes incohérentes *après* une
// correction des règles, donc avec une configuration différente de celle du
// checkpoint.
if (checkpoint && !recomputeIncoherent) {
  const rangeChanged =
    (checkpoint.startDate ?? null) !== startDate ||
    (checkpoint.endDate ?? null) !== endDate
  const rulesChanged =
    checkpoint.rulesSetKey != null
      ? checkpoint.rulesSetKey !== rulesSetKey
      : checkpoint.rulesFile != null
  if (rangeChanged || rulesChanged) {
    console.error(
      `${c.red('✘')} Le checkpoint ${checkpointPath} a été produit avec d'autres paramètres :\n` +
        `   checkpoint : startDate=${checkpoint.startDate ?? '∅'} endDate=${checkpoint.endDate ?? '∅'} rules=${checkpoint.rulesSetKey ?? checkpoint.rulesFile ?? '∅'}\n` +
        `   demandé    : startDate=${startDate ?? '∅'} endDate=${endDate ?? '∅'} rules=${rulesSetKey}\n` +
        `   Utilise --from 0 pour repartir de zéro, ou --output pour un autre fichier.`
    )
    process.exit(1)
  }
}

let lastDate = null
let lastId = null
let processed = 0
let written = 0
let incoherent = []
let errors = []
let skipped = []
let append = false

if (checkpoint) {
  lastDate = checkpoint.lastDate ?? null
  lastId = checkpoint.lastId ?? null
  processed = checkpoint.processed ?? 0
  written = checkpoint.written ?? 0
  incoherent = checkpoint.incoherent ?? []
  errors = checkpoint.errors ?? []
  skipped = checkpoint.skipped ?? []
  append = await csvExists()
  // En mode ciblé, seul le rapport du recalcul est utile : on n'affiche pas
  // l'état de reprise du parcours complet.
  if (!recomputeIncoherent) {
    console.log(
      `♻️  Reprise depuis le checkpoint (${checkpointPath}) : ` +
        `${written} simulations déjà écrites` +
        (lastDate ? `, dernière date ${lastDate}` : '')
    )
  }
} else if (!recomputeIncoherent) {
  console.log('➡️  Démarrage depuis le début')
}

const rangeLabel =
  startDate || endDate
    ? `période ${startDate ?? '∅'} → ${endDate ?? '∅'}`
    : 'toutes les simulations'

if (!recomputeIncoherent) {
  console.log(`➡️  Analyse : ${rangeLabel}`)
  console.log(
    `➡️  ${subcategories.length} règles de sous catégories à recalculer`
  )
  console.log(`➡️  Batchs de ${batch} simulations\n`)
}

const header = buildCsvHeader(subcategories)

/// ---------------------- Mode « recalcul des incohérentes » ----------------------

if (recomputeIncoherent) {
  await recomputeIncoherentSimulations()
  process.exit(0)
}

/// ---------------------- Mode « parcours complet » ----------------------

// Entête écrit uniquement pour un démarrage à neuf (sinon on complète le CSV).
if (!append) {
  await writeFile(outputPath, header.join(DELIMITER) + '\n')
}

for (;;) {
  const simulations = fetchSimulationBatch({
    lastDate,
    lastId,
    startDate,
    endDate,
    limit: batch
  })
  if (simulations.length === 0) break

  const lines = []

  for (const simulation of simulations) {
    lastDate = simulation.date
    lastId = simulation.id
    processed++

    const version = getVersionFromModel(simulation.model)

    // Les versions de prévisualisation (pr-XXXX, rc, beta…) ne sont pas
    // publiées sur npm : on les ignore au lieu de les compter comme erreurs.
    if (!isPublishedVersion(version)) {
      skipped.push({
        id: simulation.id,
        model: simulation.model,
        reason: 'version non publiée (npm)'
      })
      continue
    }

    try {
      const row = await computeSimulationRow(simulation, version)

      // Version du modèle plus ancienne (ou plus récente) que celles couvertes
      // par le catalogue : on l'ignore explicitement.
      if (row == null) {
        skipped.push({
          id: simulation.id,
          model: simulation.model,
          reason: 'version non supportée'
        })
        continue
      }

      const { line, isCoherent, bilanRounded, bilanSubcategoriesRounded } = row

      if (!isCoherent) {
        incoherent.push({
          id: simulation.id,
          version,
          bilan: bilanRounded,
          bilanSubcategories: bilanSubcategoriesRounded
        })
      }

      lines.push(line)
      written++

      if (verbose) {
        console.log(
          `${isCoherent ? c.green('✔') : c.red('✘')} ${simulation.id} ` +
            `(${simulation.model}) bilan=${bilanRounded} sous-catégories=${bilanSubcategoriesRounded}`
        )
      }
    } catch (error) {
      const details = error?.cause?.message ? ` (${error.cause.message})` : ''
      errors.push({
        id: simulation.id,
        model: simulation.model,
        message: `${error.message}${details}`
      })
      console.error(
        `${c.red('✘')} ${simulation.id} (${simulation.model}): ${error.message}${details}`
      )
    }
  }

  // On écrit d'abord les lignes du batch, puis le checkpoint : en cas de crash
  // entre les deux, on peut au pire retraiter un batch (doublons possibles)
  // mais on ne perd jamais de données.
  if (lines.length > 0) {
    await appendFile(outputPath, lines.join('\n') + '\n')
  }

  await writeCheckpoint({
    lastDate,
    lastId,
    processed,
    written,
    startDate,
    endDate,
    rulesSetKey,
    incoherent,
    errors,
    skipped,
    updatedAt: new Date().toISOString()
  })

  process.stdout.write(`\r   ${written} simulations écrites`)
}

console.log('\n')

/// ---------------------- Rapport ----------------------

console.log(`✅ ${written} simulations écrites dans ${c.bold(outputPath)}`)
console.log(`   période : ${rangeLabel}`)
console.log(`   ${subcategories.length} colonnes de sous catégories`)

if (skipped.length > 0) {
  const byReasonAndModel = skipped.reduce((acc, { model, reason }) => {
    const key = reason ?? 'raison inconnue'
    acc[key] ??= {}
    acc[key][model] = (acc[key][model] ?? 0) + 1
    return acc
  }, {})
  console.log(`\n${c.dim(`⏭  ${skipped.length} simulations ignorées :`)}`)
  for (const [reason, models] of Object.entries(byReasonAndModel)) {
    console.log(`   ${reason}`)
    for (const [model, count] of Object.entries(models)) {
      console.log(`      ${model} : ${count}`)
    }
  }
}

if (errors.length > 0) {
  console.log(`\n${c.red(`✘ ${errors.length} simulations en erreur:`)}`)
  for (const { id, model, message } of errors) {
    console.log(`   ${id} (${model}): ${message}`)
  }
}

if (incoherent.length === 0) {
  console.log(
    `\n${c.green('✔')} "bilan . sous catégories" est égal à "bilan" (arrondi au dixième) pour toutes les simulations`
  )
} else {
  console.log(
    `\n${c.red(`⚠️  ${incoherent.length} simulations flaguées (bilan . sous catégories ≠ bilan après arrondi au dixième):`)}`
  )
  for (const { id, version, bilan, bilanSubcategories } of incoherent) {
    console.log(
      `   ${id} (${version}): bilan=${bilan} sous-catégories=${bilanSubcategories}`
    )
  }
}

console.log(`\n${c.dim(`Checkpoint : ${checkpointPath}`)}`)
