/**
 * Calcule la moyenne des postes de dépense « Ravijen » (data/ui/ravijen.yaml)
 * sur les participants retenus d'un CSV produit par `recomputeSubcategories.mjs`.
 *
 * ## Filtre des participants
 *
 *   - `progression` = 1 (simulation terminée) ;
 *   - `bilan` compris entre `--min-tonnes` et `--max-tonnes` (3 à 50 t par
 *     défaut). Le `bilan` du CSV est en kgCO2e, la conversion est automatique.
 *
 * ## Calcul
 *
 * Chaque règle de `ravijen.yaml` est une agrégation de règles de sous
 * catégories (`somme` de références, ou référence directe). On évalue ces
 * agrégations **à partir des colonnes du CSV**, puis on en fait la moyenne
 * arithmétique sur les participants retenus.
 *
 * Une cellule vide du CSV compte pour `0`.
 *
 * ## Usage
 *
 *   node scripts/sous-categories/ravijenAverages.mjs \
 *     --input sous-categories-2026-09-WIP.csv \
 *     [--output <fichier.csv>] \
 *     [--min-tonnes 3] [--max-tonnes 50]
 *
 * ## Format de sortie
 *
 * Les postes sont regroupés par sous-poste (`transport`, `alimentation`,
 * `logement`, `consommation`, `services sociétaux`), dans l'ordre de
 * déclaration de `ravijen.yaml`, puis triés par poids décroissant.
 *
 *   poste;categorie;moyenne_kgCO2e;moyenne_tonnes;part_pct;part_pct_categorie
 *
 * `part_pct` est la part dans l'empreinte totale ; `part_pct_categorie` la part
 * au sein du sous-poste (ex. part de la voiture dans le transport).
 */

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import yargs from 'yargs'
import c from 'ansi-colors'
import { parse as parseYaml } from 'yaml'

// Le script vit dans `<repo>/scripts/sous-categories`.
const SCRIPT_DIR = import.meta.dirname
const REPO_DIR = path.resolve(SCRIPT_DIR, '..', '..')

const DELIMITER = ';'

/// ---------------------- Arguments ----------------------

const argv = yargs(process.argv.slice(2))
  .version(false)
  .usage(
    'Calcule la moyenne des postes Ravijen sur les simulations terminées\n\nUsage: $0 --input <fichier.csv> [options]'
  )
  .option('input', {
    alias: 'i',
    type: 'string',
    description: 'CSV source (résolu dans le dossier du script)'
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    description:
      'CSV de sortie (résolu dans le dossier du script, default: <input>.ravijen.csv)'
  })
  .option('categories', {
    type: 'string',
    description: 'Fichier YAML des postes Ravijen',
    default: 'data/ui/ravijen.yaml'
  })
  .option('min-tonnes', {
    type: 'number',
    description: 'Bilan minimal, en tonnes (inclus)',
    default: 3
  })
  .option('max-tonnes', {
    type: 'number',
    description: 'Bilan maximal, en tonnes (inclus)',
    default: 50
  })
  .demandOption('input')
  .help('h')
  .alias('h', 'help').argv

const resolveInScriptDir = (file) =>
  path.isAbsolute(file) ? file : path.join(SCRIPT_DIR, file)

const inputPath = resolveInScriptDir(argv.input)
const outputPath = resolveInScriptDir(
  argv.output ??
    path.join(
      path.dirname(argv.input),
      `${path.basename(argv.input, '.csv')}.ravijen.csv`
    )
)
const categoriesPath = path.isAbsolute(argv.categories)
  ? argv.categories
  : path.resolve(REPO_DIR, argv.categories)

/// ---------------------- Parsing CSV ----------------------

/** Découpe un CSV en lignes/colonnes (RFC 4180). */
function parseCsv(text, delimiter) {
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }
    if (char === '"') inQuotes = true
    else if (char === delimiter) {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') field += char
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

/// ---------------------- Évaluation ----------------------

/**
 * Convertit une cellule du CSV en nombre.
 *
 * Le séparateur décimal peut être une virgule (format du CSV produit par
 * `recomputeSubcategories.mjs`) ou un point ; une cellule vide vaut `0`.
 */
const parseCell = (raw) => {
  if (raw == null || raw === '') return 0
  const value = Number(String(raw).replace(',', '.'))
  return Number.isFinite(value) ? value : 0
}

/**
 * Construit un évaluateur des règles Ravijen.
 *
 * Une règle est soit une référence directe à une colonne du CSV, soit une
 * `somme` de références. Les références non résolues sont collectées pour être
 * signalées : les ignorer en silence produirait des moyennes fausses.
 *
 * @param categoryRules règles du fichier Ravijen
 * @param columnIndex `Map` nom de colonne -> index dans la ligne
 */
function buildResolver(categoryRules, columnIndex) {
  const ruleNames = new Set(Object.keys(categoryRules))
  const unresolved = new Set()

  /** Résout une référence en une fonction ligne (tableau) -> nombre. */
  const resolveReference = (reference) => {
    const index = columnIndex.get(reference)
    if (index != null) {
      return (row) => parseCell(row[index])
    }
    unresolved.add(reference)
    return () => 0
  }

  const resolvers = new Map()

  const buildResolverFor = (name) => {
    if (resolvers.has(name)) return resolvers.get(name)
    // Garde-fou contre les cycles (ne devrait pas arriver dans ce fichier).
    resolvers.set(name, () => 0)

    const rule = categoryRules[name]
    const formule = rule?.formule ?? rule?.valeur

    let resolver
    if (formule == null) {
      resolver = null // nœud de regroupement, sans formule
    } else if (typeof formule === 'string') {
      resolver = resolveReference(formule)
    } else if (Array.isArray(formule?.somme)) {
      const parts = formule.somme.map((entry) => {
        if (typeof entry !== 'string') {
          unresolved.add(`(structure inattendue dans ${name})`)
          return () => 0
        }
        return isRavijenRule(entry) && !columnIndex.has(entry)
          ? buildResolverFor(entry)
          : resolveReference(entry)
      })
      resolver = (row) => parts.reduce((total, part) => total + part(row), 0)
    } else {
      unresolved.add(`(formule non gérée dans ${name})`)
      resolver = null
    }

    resolvers.set(name, resolver)
    return resolver
  }

  // Une `somme` peut référencer une autre règle Ravijen (regroupements) ou une
  // colonne du CSV. Une référence est une règle Ravijen si elle figure dans le
  // fichier de catégories sans être une colonne du CSV.
  const isRavijenRule = (entry) => ruleNames.has(entry)

  return { buildResolverFor, unresolved }
}

/// ---------------------- Main ----------------------

const csvText = await readFile(inputPath, 'utf8')
const parsed = parseCsv(csvText, DELIMITER).filter((row) => row.length > 1)
const [header, ...dataRows] = parsed

const columnIndex = new Map(header.map((name, index) => [name, index]))
const csvColumns = new Set(header)

for (const required of ['progression', 'bilan']) {
  if (!columnIndex.has(required)) {
    console.error(
      `${c.red('✘')} Colonne « ${required} » absente de ${inputPath}.`
    )
    process.exit(1)
  }
}

const categoryRules = parseYaml(await readFile(categoriesPath, 'utf8'))

/// --- Filtre des participants

const minBilan = argv['min-tonnes'] * 1000
const maxBilan = argv['max-tonnes'] * 1000

const kept = []
let skippedProgression = 0
let skippedBilan = 0

for (const row of dataRows) {
  const progression = parseCell(row[columnIndex.get('progression')])
  const bilan = parseCell(row[columnIndex.get('bilan')])

  if (progression !== 1) {
    skippedProgression++
    continue
  }
  if (bilan < minBilan || bilan > maxBilan) {
    skippedBilan++
    continue
  }
  kept.push(row)
}

if (kept.length === 0) {
  console.error(`${c.red('✘')} Aucune simulation retenue, rien à calculer.`)
  process.exit(1)
}

/// --- Évaluation des postes

const { buildResolverFor, unresolved } = buildResolver(
  categoryRules,
  columnIndex
)

const ruleNames = Object.keys(categoryRules)
const results = []
const withoutFormula = []

for (const name of ruleNames) {
  const resolver = buildResolverFor(name)
  if (resolver == null) {
    withoutFormula.push(name)
    continue
  }
  let total = 0
  for (const row of kept) total += resolver(row)
  results.push({ name, mean: total / kept.length })
}

/// --- Écriture du CSV

const csvEscape = (value) => {
  const str = value == null ? '' : String(value)
  return str.includes(DELIMITER) || /["\n\r]/.test(str)
    ? `"${str.replace(/"/g, '""')}"`
    : str
}

const formatMean = (value) =>
  String(Math.round(value * 10) / 10).replace('.', ',')

/**
 * Sous-poste (2e segment du nom) auquel rattacher une règle.
 *
 * ex. `ravijen . transport . voiture` -> `transport`. Les règles de premier
 * niveau (`ravijen . transport`) n'ont pas de formule et sont exclues du
 * calcul.
 */
const getCategory = (name) => name.split(' . ')[1] ?? 'autre'

// Ordre d'affichage des sous-postes : celui de déclaration dans `ravijen.yaml`.
// Les nœuds de regroupement (`ravijen . <sous-poste>`, sans formule) servent de
// source d'ordre ; on complète avec les catégories rencontrées en cours de
// route pour ne rien perdre si le fichier est modifié.
const declaredOrder = Object.keys(categoryRules)
  .filter((name) => name.split(' . ').length === 2)
  .map((name) => getCategory(name))
const categoryOrder = [...declaredOrder]
for (const { name } of results) {
  const category = getCategory(name)
  if (!categoryOrder.includes(category)) categoryOrder.push(category)
}
const rankOf = (category) => {
  const index = categoryOrder.indexOf(category)
  return index === -1 ? categoryOrder.length : index
}

// Totaux par sous-poste, pour calculer la part de chaque poste au sein de sa
// propre catégorie (ex. part de la voiture dans le transport).
const totalByCategory = new Map()
for (const { name, mean } of results) {
  const category = getCategory(name)
  totalByCategory.set(category, (totalByCategory.get(category) ?? 0) + mean)
}

const totalGeneral = results.reduce((sum, { mean }) => sum + mean, 0)

// Tri : sous-poste (ordre du YAML), puis poids décroissant.
const sorted = [...results].sort((a, b) => {
  const categoryA = getCategory(a.name)
  const categoryB = getCategory(b.name)
  if (categoryA !== categoryB) return rankOf(categoryA) - rankOf(categoryB)
  if (b.mean !== a.mean) return b.mean - a.mean
  return a.name.localeCompare(b.name)
})

const lines = [
  'poste;categorie;moyenne_kgCO2e;moyenne_tonnes;part_pct;part_pct_categorie'
]
for (const { name, mean } of sorted) {
  const category = getCategory(name)
  const categoryTotal = totalByCategory.get(category) ?? 0
  const shareTotal = totalGeneral > 0 ? (mean / totalGeneral) * 100 : 0
  const shareCategory = categoryTotal > 0 ? (mean / categoryTotal) * 100 : 0
  lines.push(
    [
      csvEscape(name),
      csvEscape(category),
      formatMean(mean),
      formatMean(mean / 1000),
      formatMean(shareTotal),
      formatMean(shareCategory)
    ].join(DELIMITER)
  )
}

await writeFile(outputPath, lines.join('\n') + '\n')

/// ---------------------- Rapport ----------------------

console.log(`✅ ${outputPath}\n`)
console.log(`   Participants retenus : ${kept.length}`)
console.log(
  `      ${skippedProgression} écarté(s) (progression ≠ 1), ` +
    `${skippedBilan} écarté(s) (bilan hors ${argv['min-tonnes']}–${argv['max-tonnes']} t)`
)
console.log(`   Postes calculés      : ${results.length}`)
if (withoutFormula.length > 0) {
  console.log(
    `   Sans formule (non calculés) : ${withoutFormula.length} — ${withoutFormula.join(', ')}`
  )
}

if (unresolved.size > 0) {
  console.log(
    `\n${c.red(`⚠️  ${unresolved.size} référence(s) introuvable(s) dans le CSV (comptée(s) pour 0) :`)}`
  )
  for (const reference of unresolved) {
    console.log(`   - ${reference.split(' - ').slice(0, 1)[0].slice(0, 100)}`)
  }
  console.log(
    `   Corrige raviijen.yaml ou le CSV : ces postes sont sous-estimés.`
  )
}

console.log(`\n--- Moyennes (kgCO2e) par sous-poste ---`)
let currentCategory = null
for (const { name, mean } of sorted) {
  const category = getCategory(name)
  if (category !== currentCategory) {
    currentCategory = category
    const categoryTotal = totalByCategory.get(category) ?? 0
    console.log(
      `\n  ${c.bold(category.toUpperCase())}  —  ${Math.round(categoryTotal * 10) / 10} kg (${formatMean((categoryTotal / totalGeneral) * 100)} %)`
    )
  }
  const shareCategory =
    (totalByCategory.get(category) ?? 0) > 0
      ? (mean / totalByCategory.get(category)) * 100
      : 0
  console.log(
    `   ${String(Math.round(mean * 10) / 10).padStart(9)}  ` +
      `${String(formatMean(shareCategory)).padStart(6)} %  ` +
      `${name.replace('ravijen . ', '')}`
  )
}
