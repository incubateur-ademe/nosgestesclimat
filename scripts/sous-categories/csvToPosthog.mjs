/**
 * Convertit le CSV produit par `recomputeSubcategories.mjs` vers un CSV
 * directement importable dans PostHog.
 *
 * ## Différences entre les deux formats
 *
 *   - séparateur de champ : `;` (français)  ->  `,`
 *   - séparateur décimal : `,` (français)   ->  `.`
 *
 * PostHog attend un CSV au format anglo-saxon : si l'on importait directement
 * le fichier d'origine, les valeurs comme `7738,5` seraient lues comme du texte
 * et le séparateur `;` ne serait pas reconnu.
 *
 * ## Usage
 *
 *   node scripts/sous-categories/csvToPosthog.mjs \
 *     --input sous-categories-2026-09-prod.csv \
 *     [--output sous-categories-2026-09-prod.posthog.csv]
 *
 * Par défaut, le fichier de sortie porte le même nom que l'entrée, suffixé de
 * `.posthog.csv`.
 */

import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import yargs from 'yargs'
import c from 'ansi-colors'

// Le script vit dans `<repo>/scripts/sous-categories`.
const SCRIPT_DIR = import.meta.dirname

const INPUT_DELIMITER = ';'
const OUTPUT_DELIMITER = ','

/// ---------------------- Arguments ----------------------

const argv = yargs(process.argv.slice(2))
  .version(false)
  .usage(
    'Convertit un CSV (séparateur ";" et virgule décimale) en CSV importable dans PostHog (séparateur "," et point décimal)\n\nUsage: $0 --input <fichier.csv> [options]'
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
      'CSV de sortie (résolu dans le dossier du script, default: <input>.posthog.csv)'
  })
  .demandOption('input')
  .help('h')
  .alias('h', 'help').argv

const resolve = (file) =>
  path.isAbsolute(file) ? file : path.join(SCRIPT_DIR, file)

const inputPath = resolve(argv.input)
const outputPath = resolve(
  argv.output ??
    path.join(
      path.dirname(argv.input),
      `${path.basename(argv.input, '.csv')}.posthog.csv`
    )
)

/// ---------------------- Parsing / sérialisation ----------------------

/**
 * Découpe un CSV en lignes/colonnes (RFC 4180).
 *
 * Gère les champs entre guillemets (guillemets internes doublés), les sauts de
 * ligne à l'intérieur d'un champ, et les fins de ligne `\n` ou `\r\n`.
 */
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

    if (char === '"') {
      inQuotes = true
    } else if (char === delimiter) {
      row.push(field)
      field = ''
    } else if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else if (char !== '\r') {
      field += char
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

/** Échappe un champ pour un CSV : guillemets si le séparateur apparaît. */
const serializeField = (value, delimiter) => {
  const str = value == null ? '' : String(value)
  const needsQuotes =
    str.includes(delimiter) || str.includes('"') || /[\n\r]/.test(str)
  return needsQuotes ? `"${str.replace(/"/g, '""')}"` : str
}

/**
 * Convertit une valeur décimale française (`7738,5`, `-0,1`) en notation
 * anglo-saxonne (`7738.5`, `-0.1`).
 *
 * Seules les cellules purement numériques sont converties : une virgule dans un
 * libellé (ex. « logement, divers ») ne doit pas être touchée.
 */
const FRENCH_NUMBER_RE = /^-?\d+(,\d+)?$/
const toAngloNumber = (value) =>
  FRENCH_NUMBER_RE.test(value) ? value.replace(',', '.') : value

/// ---------------------- Main ----------------------

const csvText = await readFile(inputPath, 'utf8')
const rows = parseCsv(csvText, INPUT_DELIMITER).filter(
  (row) => row.length > 1 || (row.length === 1 && row[0] !== '')
)

if (rows.length === 0) {
  console.error(`${c.red('✘')} Le fichier ${inputPath} est vide.`)
  process.exit(1)
}

const header = rows[0]
const dataRows = rows.slice(1)

// Les colonnes numériques sont identifiées à partir de l'entête : les cinq
// premières (`simulationId`, `date`, `progression`, `bilan`, `bilanCoherent`)
// ne suivent pas la même règle, `bilanCoherent` étant un booléen.
const NUMBER_COLUMNS = new Set(
  header.filter((name) => name.startsWith('bilan'))
)
NUMBER_COLUMNS.add('progression')

let converted = 0
const outputRows = [header]

for (const row of dataRows) {
  outputRows.push(
    row.map((value, index) => {
      const name = header[index]
      if (!NUMBER_COLUMNS.has(name)) return value
      const convertedValue = toAngloNumber(value)
      if (convertedValue !== value) converted++
      return convertedValue
    })
  )
}

const outputText =
  outputRows
    .map((row) =>
      row.map((v) => serializeField(v, OUTPUT_DELIMITER)).join(OUTPUT_DELIMITER)
    )
    .join('\n') + '\n'

await writeFile(outputPath, outputText)

/// ---------------------- Rapport ----------------------

console.log(`${c.green('✔')} ${dataRows.length} lignes converties`)
console.log(`   source    : ${c.bold(inputPath)}`)
console.log(`   sortie    : ${c.bold(outputPath)}`)
console.log(
  `   ${header.length} colonnes, ${converted} valeurs décimales réécrites`
)
