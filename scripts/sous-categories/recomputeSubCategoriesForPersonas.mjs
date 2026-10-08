/**
 * Calcule les « sous catégories » (data/ui/subcategories.publicodes) pour les
 * situations de personas, et exporte le résultat dans un CSV.
 *
 * C'est le pendant de `recomputeSubcategories.mjs`, mais les situations ne
 * viennent pas de la base : elles viennent d'un fichier YAML (par défaut
 * `data/ui/personas-ui.yaml`). Le CSV produit est au **même format** que celui
 * de `recomputeSubcategories.mjs` : une ligne par situation, une colonne par
 * règle de sous catégories. Il est donc directement consommable par
 * `customSubcategories.mjs` (calcul des postes de `ravijen.yaml`,
 * `page-de-fin.yaml`… par situation ou en moyenne).
 *
 * ## Format de fichier de situations accepté
 *
 *   1. situation « nue » : le YAML associe un nom à une situation
 *      (`data/ui/personas-ui.yaml`) ;
 *   2. persona complet : le YAML associe un nom à un objet contenant `nom`,
 *      `description`… et `situation` (`personas/personas-fr.yaml`).
 *
 * Le préfixe `personas . ` est retiré des noms, s'il est présent.
 *
 * ## Modèle utilisé
 *
 * Les règles proviennent des mêmes helpers que les tests de non-régression
 * (`tests/commons.mjs`) :
 *
 *   - par défaut, le modèle **local** (`public/co2-model.<pays>-lang.<lang>.json`,
 *     donc après `pnpm compile`) ;
 *   - avec `--version nightly` ou `--version latest`, le modèle **prod**
 *     correspondant (`getRulesFromDist`).
 *
 * Les chiffres sont ainsi directement comparables à ceux de `testPersonas`.
 * Le script doit donc être lancé depuis la racine du dépôt (les chemins de
 * `public/` y sont relatifs).
 *
 * ## Cohérence
 *
 * Comme `recomputeSubcategories.mjs`, le script vérifie que la somme des sous
 * catégories égale `bilan` (à l'arrondi au dixième près) et flague les
 * situations incohérentes.
 *
 * ## Usage
 *
 *   node scripts/sous-categories/recomputeSubCategoriesForPersonas.mjs \
 *     [--situations data/ui/personas-ui.yaml] \
 *     [--output sous-categories-personas.csv] \
 *     [--rules data/ui/subcategories.publicodes] \
 *     [--country FR] [--language fr] [--version nightly] \
 *     [--metric carbone] \
 *     [--verbose]
 */

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import yargs from 'yargs'
import c from 'ansi-colors'
import { parse as parseYaml } from 'yaml'
import Engine from 'publicodes'
import { getModelFromSource } from '@publicodes/tools/compilation'
import utils from '@incubateur-ademe/nosgestesclimat-scripts/utils'

import { getLocalRules, getRulesFromDist } from '../../tests/commons.mjs'

import { DELIMITER } from './lib/csv.mjs'
import {
  SUB_CATEGORIES_ROOT,
  buildCsvHeader,
  buildCsvLine,
  engineOptions,
  roundToTenth,
  splitSubcategoryRules,
  toNumber
} from './lib/subcategories.mjs'

// Le script vit dans `<repo>/scripts/sous-categories`.
const SCRIPT_DIR = import.meta.dirname
const REPO_DIR = path.resolve(SCRIPT_DIR, '..', '..')

const DEFAULT_SITUATIONS = 'data/ui/personas-ui.yaml'
const DEFAULT_RULES = 'data/ui/subcategories.publicodes'

/// ---------------------- Arguments ----------------------

const argv = yargs(process.argv.slice(2))
  .version(false)
  .usage(
    'Calcule les sous catégories pour les situations de personas\n\nUsage: $0 [options]'
  )
  .option('situations', {
    alias: 's',
    type: 'string',
    description:
      'Fichier YAML des situations (personas-ui.yaml, personas-fr.yaml…)',
    default: DEFAULT_SITUATIONS
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    description: 'CSV de sortie (résolu dans le dossier du script)',
    default: 'sous-categories-personas.csv'
  })
  .option('rules', {
    alias: 'r',
    type: 'string',
    description: 'Fichier des règles de sous catégories',
    default: DEFAULT_RULES
  })
  .option('country', {
    alias: 'C',
    type: 'string',
    description: 'Code du pays du modèle à charger',
    default: 'FR'
  })
  .option('language', {
    alias: 'l',
    type: 'string',
    description: `Langue du modèle à charger (${utils.availableLanguages.join(', ')})`,
    default: utils.defaultLang
  })
  .option('version', {
    type: 'string',
    description:
      "Modèle distant à utiliser ('nightly' ou 'latest') au lieu du modèle local",
    choices: ['nightly', 'latest']
  })
  .option('metric', {
    type: 'string',
    description: 'Métrique évaluée (carbone ou eau)',
    default: 'carbone'
  })
  .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Affiche le détail par situation'
  })
  .help('h')
  .alias('h', 'help').argv

const {
  situations,
  output,
  rules,
  country,
  language,
  version,
  metric,
  verbose
} = argv

const resolveInRepo = (file) =>
  path.isAbsolute(file) ? file : path.resolve(REPO_DIR, file)

const resolveInScriptDir = (file) =>
  path.isAbsolute(file) ? file : path.join(SCRIPT_DIR, file)

const situationsPath = resolveInRepo(situations)
const outputPath = resolveInScriptDir(output)
const rulesPath = resolveInRepo(rules)

/// ---------------------- Lecture des situations ----------------------

/**
 * Normalise le YAML des situations en `{ nom: situation }`.
 *
 * Accepte les deux formats décrits en tête de fichier, et retire le préfixe
 * `personas . ` des noms.
 */
function extractSituations(raw) {
  const extracted = {}
  for (const [rawName, value] of Object.entries(raw ?? {})) {
    const name = rawName.replace(/^personas\s*\.\s*/, '')
    const nested = value?.situation
    const situation =
      typeof nested === 'object' && nested !== null ? nested : value
    extracted[name] = situation ?? {}
  }
  return extracted
}

/// ---------------------- Main ----------------------

const allRules = version
  ? await getRulesFromDist(version, country, language)
  : await getLocalRules(country, language)

console.log(
  `➡️  Modèle ${version ?? 'local'} ${country}-${language} : ${Object.keys(allRules).length} règles`
)

// Les règles de sous catégories font partie du modèle, mais on les recharge
// depuis `--rules` : c'est ce fichier qui définit les colonnes du CSV, et il
// permet de surcharger les sous catégories (ex. `subcategories.avant-4.16.0.yaml`).
const rulesFile = getModelFromSource([rulesPath])
const engine = new Engine({ ...allRules, ...rulesFile }, engineOptions)

/**
 * Ensemble des règles réellement connues du moteur.
 *
 * On ne peut pas se fier aux clés du modèle brut (`getModelFromSource`) : les
 * enfants définis dans un bloc `avec:` (ex. `logement . chauffage . appoint .
 * électricité . présent`) y restent imbriqués sous leur parent, alors que le
 * moteur les expose comme des règles à part entière.
 */
const knownRules = new Set(Object.keys(engine.getParsedRules()))

// Les colonnes sont dérivées du fichier de règles (et non du modèle) pour
// garantir le même ordre que `recomputeSubcategories.mjs`.
const { columns } = splitSubcategoryRules(rulesFile)
if (columns.length === 0) {
  console.error(`${c.red('✘')} Aucune règle de sous catégories dans ${rules}.`)
  process.exit(1)
}

const rawSituations = parseYaml(await readFile(situationsPath, 'utf8'))
const allSituations = extractSituations(rawSituations)
const situationNames = Object.keys(allSituations)

if (situationNames.length === 0) {
  console.error(`${c.red('✘')} Aucune situation dans ${situationsPath}.`)
  process.exit(1)
}

console.log(`➡️  ${situationNames.length} situation(s) à calculer`)
console.log(`➡️  ${columns.length} règles de sous catégories\n`)

const generationDate = new Date().toISOString().slice(0, 10)
const lines = [buildCsvHeader(columns).join(DELIMITER)]
const incoherent = []
const unknownKeys = new Map()

for (const name of situationNames) {
  // La métrique est fixée pour toutes les situations, comme dans les tests de
  // non-régression des personas.
  engine.setSituation({ ...allSituations[name], métrique: `'${metric}'` })

  const ignored = Object.keys(allSituations[name]).filter(
    (key) => !knownRules.has(key)
  )
  for (const key of ignored) {
    if (!unknownKeys.has(key)) unknownKeys.set(key, [])
    unknownKeys.get(key).push(name)
  }

  const bilan = roundToTenth(toNumber(engine.evaluate('bilan').nodeValue))
  const bilanSubcategories = roundToTenth(
    toNumber(engine.evaluate(SUB_CATEGORIES_ROOT).nodeValue)
  )
  const isCoherent = bilanSubcategories === bilan

  const values = {}
  for (const column of columns) {
    values[column] = roundToTenth(toNumber(engine.evaluate(column).nodeValue))
  }

  lines.push(
    buildCsvLine(
      {
        id: name,
        date: generationDate,
        progression: 1,
        bilan,
        isCoherent
      },
      columns,
      values
    )
  )

  if (!isCoherent) {
    incoherent.push({ name, bilan, bilanSubcategories })
  }

  if (verbose) {
    console.log(
      `   ${name.padEnd(28)} ${String(bilan).padStart(9)} kg  ` +
        `(sous catégories : ${bilanSubcategories} kg)`
    )
  }
}

await writeFile(outputPath, lines.join('\n') + '\n')

/// ---------------------- Rapport ----------------------

console.log(`\n✅ ${outputPath}\n`)
console.log(`   Situations calculées : ${situationNames.length}`)
console.log(`   Colonnes de sous catégories : ${columns.length}`)

if (incoherent.length > 0) {
  console.log(
    `\n${c.yellow(`⚠️  ${incoherent.length} situation(s) incohérente(s) (bilan ≠ somme des sous catégories) :`)}`
  )
  for (const { name, bilan, bilanSubcategories } of incoherent) {
    console.log(
      `   - ${name} : bilan ${bilan} kg, sous catégories ${bilanSubcategories} kg`
    )
  }
}

if (unknownKeys.size > 0) {
  console.log(
    `\n${c.yellow(`⚠️  ${unknownKeys.size} règle(s) des situations sont absentes du modèle (ignorées par le moteur) :`)}`
  )
  const sortedUnknown = [...unknownKeys.entries()].sort(
    (a, b) => b[1].length - a[1].length
  )
  for (const [key, names] of sortedUnknown) {
    console.log(
      `   - ${key} (${names.length} situation${names.length > 1 ? 's' : ''})` +
        (verbose ? ` : ${names.join(', ')}` : '')
    )
  }
}
