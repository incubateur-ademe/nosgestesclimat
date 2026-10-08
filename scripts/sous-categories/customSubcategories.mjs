/**
 * Calcule les postes « custom » décrits dans un fichier YAML
 * (`data/ui/ravijen.yaml`, `data/ui/page-de-fin.yaml`…) à partir d'un CSV de
 * sous catégories produit par `recomputeSubcategories.mjs` ou
 * `recomputeSubCategoriesForPersonas.mjs`.
 *
 * Chaque poste custom est une agrégation de règles de sous catégories
 * (`somme` de références, ou référence directe). On évalue ces agrégations
 * **à partir des colonnes du CSV**, ce qui permet de calculer les postes sans
 * relancer le moteur Publicodes.
 *
 * Une cellule vide du CSV compte pour `0`.
 *
 * ## Deux modes de sortie
 *
 *   - **moyenne** (défaut) : un poste par ligne, moyenné sur les situations
 *     retenues ;
 *   - **par situation** (`--per-situation`) : une ligne par couple
 *     situation × poste, pour comparer les profils entre eux.
 *
 * ## Filtre des participants
 *
 * Les colonnes `progression` et `bilan` sont optionnelles : lorsqu'elles sont
 * présentes (CSV de simulations), seules les simulations terminées
 * (`progression` = 1) dont le `bilan` est compris entre `--min-tonnes` et
 * `--max-tonnes` sont retenues. `--no-filter` désactive ces filtres (utile pour
 * un CSV de personas, où l'on veut toutes les situations).
 *
 * ## Usage
 *
 *   # Moyenne des postes de la page de fin, sur des personas
 *   node scripts/sous-categories/customSubcategories.mjs \
 *     --input sous-categories-personas.csv \
 *     --categories data/ui/page-de-fin.yaml \
 *     --no-filter
 *
 *   # Détail par situation
 *   node scripts/sous-categories/customSubcategories.mjs \
 *     --input sous-categories-personas.csv \
 *     --categories data/ui/page-de-fin.yaml \
 *     --no-filter --per-situation
 *
 *   # Moyennes Ravijen sur les simulations de septembre (comportement historique)
 *   node scripts/sous-categories/customSubcategories.mjs \
 *     --input sous-categories-2026-09-WIP.csv
 *
 * ## Format de sortie
 *
 * Les postes sont regroupés par sous-poste (`transport`, `alimentation`,
 * `logement`, `consommation`, `services sociétaux`), dans l'ordre de
 * déclaration du fichier de postes, puis triés par poids décroissant.
 *
 *   moyenne       : poste;categorie;moyenne_kgCO2e;moyenne_tonnes;part_pct;part_pct_categorie
 *   par situation : situation;poste;categorie;kgCO2e;tonnes;part_pct;part_pct_categorie
 *
 * `part_pct` est la part dans le total des postes du fichier ;
 * `part_pct_categorie` la part au sein du sous-poste (ex. part de la voiture
 * dans le transport).
 */

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import yargs from 'yargs'
import c from 'ansi-colors'
import { parse as parseYaml, stringify } from 'yaml'

import { DELIMITER, csvEscape, parseCell, parseCsv } from './lib/csv.mjs'

// Le script vit dans `<repo>/scripts/sous-categories`.
const SCRIPT_DIR = import.meta.dirname
const REPO_DIR = path.resolve(SCRIPT_DIR, '..', '..')

/// ---------------------- Arguments ----------------------

const argv = yargs(process.argv.slice(2))
  .version(false)
  // `--no-filter` est le nom d'une option : sans cela, yargs l'interprète comme
  // la négation d'une option `--filter`.
  .parserConfiguration({ 'boolean-negation': false })
  .usage(
    'Calcule les postes « custom » (ravijen.yaml, page-de-fin.yaml…) sur un CSV de sous catégories\n\nUsage: $0 --input <fichier.csv> [options]'
  )
  .option('input', {
    alias: 'i',
    type: 'string',
    description:
      'CSV des sous catégories (résolu dans le dossier du script, sauf chemin absolu)'
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    description:
      'Fichier de sortie (résolu dans le dossier du script, sauf chemin absolu)'
  })
  .option('format', {
    alias: 'f',
    type: 'string',
    description: 'Format de sortie',
    choices: ['csv', 'yaml'],
    default: 'csv'
  })
  .option('categories', {
    alias: 'c',
    type: 'string',
    description: 'Fichier YAML décrivant les postes à calculer',
    default: 'data/ui/ravijen.yaml'
  })
  .option('per-situation', {
    type: 'boolean',
    description:
      'Sortie détaillée : une ligne par situation et par poste, au lieu de la moyenne',
    default: false
  })
  .option('situation', {
    alias: 'S',
    type: 'string',
    array: true,
    description: 'Ne calculer que ces situations (parmi les lignes du CSV)'
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
  .option('no-filter', {
    type: 'boolean',
    description:
      'Ne filtrer ni sur `progression` ni sur le `bilan` (utile pour un CSV de personas)',
    default: false
  })
  .demandOption('input')
  .help('h')
  .alias('h', 'help').argv

const resolveInScriptDir = (file) =>
  path.isAbsolute(file) ? file : path.join(SCRIPT_DIR, file)

/** `data/ui/page-de-fin.yaml` -> `page-de-fin` (pour nommer la sortie). */
const slugify = (file) =>
  path
    .basename(file, path.extname(file))
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()

const inputPath = resolveInScriptDir(argv.input)
// Les deux modes produisent des tableaux différents : le mode détaillé a son
// propre nom de fichier par défaut, pour ne pas écraser la moyenne.
const modeSuffix = argv['per-situation'] ? '.per-situation' : ''
const outputPath = resolveInScriptDir(
  argv.output ??
    path.join(
      path.dirname(argv.input),
      `${path.basename(argv.input, '.csv')}.${slugify(argv.categories)}${modeSuffix}.${argv.format}`
    )
)
const categoriesPath = path.isAbsolute(argv.categories)
  ? argv.categories
  : path.resolve(REPO_DIR, argv.categories)

/// ---------------------- Évaluation ----------------------

/**
 * Construit un évaluateur des postes custom.
 *
 * Un poste est soit une référence directe à une colonne du CSV, soit une
 * `somme` d'autres postes et/ou de références. Les références non résolues sont
 * collectées pour être signalées : les ignorer en silence produirait des
 * moyennes fausses.
 *
 * @param categoryRules règles du fichier de postes
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
    // Garde-fou contre les cycles (ne devrait pas arriver dans ces fichiers).
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
        // Une référence est un poste custom si elle figure dans le fichier de
        // postes sans être une colonne du CSV.
        return ruleNames.has(entry) && !columnIndex.has(entry)
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

  return { buildResolverFor, unresolved }
}

/// ---------------------- Lecture du CSV ----------------------

const csvText = await readFile(inputPath, 'utf8')
const parsed = parseCsv(csvText, DELIMITER).filter((row) => row.length > 1)
const [header, ...dataRows] = parsed

const columnIndex = new Map(header.map((name, index) => [name, index]))

// Les colonnes de filtrage sont optionnelles : un CSV de sous catégories peut
// n'être qu'un tableau de valeurs (personas).
const progressionIndex = columnIndex.get('progression')
const bilanIndex = columnIndex.get('bilan')

const categoryRules = parseYaml(await readFile(categoriesPath, 'utf8'))

/// --- Filtre des situations

const minBilan = argv['min-tonnes'] * 1000
const maxBilan = argv['max-tonnes'] * 1000
const noFilter = argv['no-filter']
const wantedSituations = new Set(argv.situation ?? [])
const situationIndex = columnIndex.get('simulationId')

if (wantedSituations.size > 0 && situationIndex == null) {
  console.error(
    `${c.red('✘')} --situation nécessite une colonne « simulationId » dans ${inputPath}.`
  )
  process.exit(1)
}

const kept = []
let skippedProgression = 0
let skippedBilan = 0
let skippedSituation = 0

for (const row of dataRows) {
  if (wantedSituations.size > 0) {
    const id = row[situationIndex]
    if (!wantedSituations.has(id)) {
      skippedSituation++
      continue
    }
  }

  if (!noFilter && progressionIndex != null) {
    if (parseCell(row[progressionIndex]) !== 1) {
      skippedProgression++
      continue
    }
  }
  if (!noFilter && bilanIndex != null) {
    const bilan = parseCell(row[bilanIndex])
    if (bilan < minBilan || bilan > maxBilan) {
      skippedBilan++
      continue
    }
  }
  kept.push(row)
}

if (kept.length === 0) {
  console.error(`${c.red('✘')} Aucune situation retenue, rien à calculer.`)
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
  // Valeur de chaque poste pour chaque situation retenue : sert au calcul de la
  // moyenne comme à la sortie détaillée.
  const values = kept.map((row) => resolver(row))
  results.push({
    name,
    values,
    mean: values.reduce((total, value) => total + value, 0) / kept.length
  })
}

/// ---------------------- Mise en forme ----------------------

/**
 * Nom du sous-poste (2e segment du nom) auquel rattacher un poste.
 *
 * ex. `ravijen . transport . voiture` -> `transport`. Les nœuds de premier
 * niveau (`ravijen . transport`) n'ont pas de formule et sont exclus.
 */
const getCategory = (name) => name.split(' . ')[1] ?? 'autre'

/** Racine du fichier de postes (`ravijen`, `page de fin`…). */
const root = ruleNames[0]?.split(' . ')[0] ?? ''

// Ordre d'affichage des sous-postes : celui de déclaration dans le fichier.
// Les nœuds de regroupement (`<racine> . <sous-poste>`, sans formule) servent de
// source d'ordre ; on complète avec les catégories rencontrées en cours de
// route pour ne rien perdre si le fichier est modifié.
const declaredOrder = ruleNames
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

// Tri : sous-poste (ordre du fichier), puis poids décroissant.
const sorted = [...results].sort((a, b) => {
  const categoryA = getCategory(a.name)
  const categoryB = getCategory(b.name)
  if (categoryA !== categoryB) return rankOf(categoryA) - rankOf(categoryB)
  if (b.mean !== a.mean) return b.mean - a.mean
  return a.name.localeCompare(b.name)
})

const formatMean = (value) =>
  String(Math.round(value * 10) / 10).replace('.', ',')

const shareOf = (value, total) => (total > 0 ? (value / total) * 100 : 0)

/** Arrondit un nombre au dixième (valeur numérique, pas chaîne). */
const round1 = (value) => Math.round(value * 10) / 10

/// --- Résultats structurés

// Détail par situation : sert au CSV comme au YAML. Les noms sont raccourcis
// (racine retirée) pour la lisibilité, `fullName` conserve le nom Publicodes.
const situationReports = kept.map((row, i) => {
  const total = sorted.reduce((sum, poste) => sum + poste.values[i], 0)
  const postes = sorted.map(({ name, values }) => {
    const category = getCategory(name)
    const categoryTotal = sorted
      .filter((poste) => getCategory(poste.name) === category)
      .reduce((sum, poste) => sum + poste.values[i], 0)
    return {
      name: name.replace(`${root} . `, ''),
      category,
      value: values[i],
      partTotal: shareOf(values[i], total),
      partCategory: shareOf(values[i], categoryTotal)
    }
  })
  return {
    situation: row[situationIndex] ?? `situation ${i + 1}`,
    total,
    postes
  }
})

/// --- Écriture du fichier

let output

if (argv.format === 'yaml') {
  // Le YAML ne porte que les valeurs (kgCO2e) et le total ; les parts restent
  // dans le CSV, plus adapté aux tableurs.
  output = argv['per-situation']
    ? Object.fromEntries(
        situationReports.map(({ situation, total, postes }) => [
          situation,
          {
            total: round1(total),
            postes: Object.fromEntries(
              postes.map(({ name, value }) => [name, round1(value)])
            )
          }
        ])
      )
    : {
        total: round1(totalGeneral),
        postes: Object.fromEntries(
          sorted.map(({ name, mean }) => [
            name.replace(`${root} . `, ''),
            round1(mean)
          ])
        )
      }
} else if (argv['per-situation']) {
  // Une ligne par situation et par poste : le tri principal suit la situation
  // (ordre du CSV), le secondaire l'ordre d'affichage des postes.
  const lines = [
    'situation;poste;categorie;kgCO2e;tonnes;part_pct;part_pct_categorie'
  ]
  for (const { situation, postes } of situationReports) {
    for (const { name, category, value, partTotal, partCategory } of postes) {
      lines.push(
        [
          csvEscape(situation),
          csvEscape(name),
          csvEscape(category),
          formatMean(value),
          formatMean(value / 1000),
          formatMean(partTotal),
          formatMean(partCategory)
        ].join(DELIMITER)
      )
    }
  }
  output = lines.join('\n') + '\n'
} else {
  const lines = [
    'poste;categorie;moyenne_kgCO2e;moyenne_tonnes;part_pct;part_pct_categorie'
  ]
  for (const { name, mean } of sorted) {
    const category = getCategory(name)
    const categoryTotal = totalByCategory.get(category) ?? 0
    lines.push(
      [
        csvEscape(name),
        csvEscape(category),
        formatMean(mean),
        formatMean(mean / 1000),
        formatMean(shareOf(mean, totalGeneral)),
        formatMean(shareOf(mean, categoryTotal))
      ].join(DELIMITER)
    )
  }
  output = lines.join('\n') + '\n'
}

if (argv.format === 'yaml') {
  await writeFile(outputPath, stringify(output, { lineWidth: 0 }))
} else {
  await writeFile(outputPath, output)
}

/// ---------------------- Rapport ----------------------

console.log(`✅ ${outputPath}\n`)
console.log(`   Postes               : ${results.length} (${categoriesPath})`)
console.log(
  `   Situations retenues  : ${kept.length}` +
    (noFilter
      ? ' (filtres désactivés)'
      : `\n      ${skippedProgression} écartée(s) (progression ≠ 1), ` +
        `${skippedBilan} écartée(s) (bilan hors ${argv['min-tonnes']}–${argv['max-tonnes']} t)`)
)
if (skippedSituation > 0) {
  console.log(`      ${skippedSituation} écartée(s) (hors --situation)`)
}
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
    console.log(`   - ${reference}`)
  }
  console.log(
    `   Corrige ${path.basename(categoriesPath)} ou le CSV : ces postes sont sous-estimés.`
  )
}

if (argv['per-situation']) {
  console.log(`\n--- Postes (kgCO2e) par situation ---`)
  for (let i = 0; i < kept.length; i++) {
    const situation = kept[i][situationIndex] ?? `situation ${i + 1}`
    const situationTotal = sorted.reduce(
      (sum, poste) => sum + poste.values[i],
      0
    )
    console.log(
      `\n  ${c.bold(situation)} — ${formatMean(situationTotal)} kg (${formatMean(situationTotal / 1000)} t)`
    )
    for (const { name, values } of sorted) {
      console.log(
        `   ${String(formatMean(values[i])).padStart(9)}  ` +
          `${String(formatMean(shareOf(values[i], situationTotal))).padStart(6)} %  ` +
          `${name.replace(`${root} . `, '')}`
      )
    }
  }
} else {
  console.log(`\n--- Moyennes (kgCO2e) par sous-poste ---`)
  let currentCategory = null
  for (const { name, mean } of sorted) {
    const category = getCategory(name)
    if (category !== currentCategory) {
      currentCategory = category
      const categoryTotal = totalByCategory.get(category) ?? 0
      console.log(
        `\n  ${c.bold(category.toUpperCase())}  —  ${formatMean(categoryTotal)} kg (${formatMean(shareOf(categoryTotal, totalGeneral))} %)`
      )
    }
    console.log(
      `   ${String(formatMean(mean)).padStart(9)}  ` +
        `${String(formatMean(shareOf(mean, totalByCategory.get(category)))).padStart(6)} %  ` +
        `${name.replace(`${root} . `, '')}`
    )
  }
}
