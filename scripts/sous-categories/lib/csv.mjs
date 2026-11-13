/**
 * Helpers CSV partagés par les scripts de `scripts/sous-categories`.
 *
 * Le format est celui produit par `recomputeSubcategories.mjs` : séparateur
 * `;`, convention française (virgule décimale), échappement RFC 4180.
 *
 * Le partage garantit qu'un CSV écrit par un script est relisible tel quel par
 * les autres.
 */

import { formatValue } from 'publicodes'
import { StringDecoder } from 'node:string_decoder'

export const DELIMITER = ';'

/** Découpe un CSV en lignes/colonnes (RFC 4180). */
export function parseCsv(text, delimiter = DELIMITER) {
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

/**
 * Découpe un flux CSV en lignes/colonnes (RFC 4180), sans charger le fichier
 * entier en mémoire : indispensable au-delà de quelques centaines de Mo, taille
 * à laquelle V8 refuse les chaînes (`RangeError: Invalid string length`).
 *
 * Les guillemets échappés (`""`) peuvent être à cheval sur deux morceaux du
 * flux : l'état est conservé d'un morceau à l'autre.
 *
 * @param {AsyncIterable<string|Buffer>} readable flux (ex. `createReadStream`)
 */
export async function* parseCsvStream(readable, delimiter = DELIMITER) {
  let row = []
  let field = ''
  let inQuotes = false
  let quotePending = false
  let completed = []
  const decoder = new StringDecoder('utf8')
  const decode = (chunk) =>
    typeof chunk === 'string' ? chunk : decoder.write(chunk)

  const feed = (text) => {
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      if (inQuotes) {
        if (quotePending) {
          quotePending = false
          if (char === '"') {
            field += '"'
            continue
          }
          inQuotes = false
        } else if (char === '"') {
          quotePending = true
          continue
        } else {
          field += char
          continue
        }
      }
      if (char === '"') inQuotes = true
      else if (char === delimiter) {
        row.push(field)
        field = ''
      } else if (char === '\n') {
        row.push(field)
        completed.push(row)
        row = []
        field = ''
      } else if (char !== '\r') field += char
    }
  }

  for await (const chunk of readable) {
    // Un morceau peut couper un caractère multi-octets : le décodeur conserve
    // les octets incomplets pour le morceau suivant.
    feed(decode(chunk))
    if (completed.length > 0) {
      yield* completed
      completed = []
    }
  }
  feed(decoder.end())
  if (quotePending) inQuotes = false
  if (field !== '' || row.length > 0) {
    row.push(field)
    completed.push(row)
  }
  yield* completed
}

/**
 * Convertit une cellule du CSV en nombre.
 *
 * Le séparateur décimal peut être une virgule ou un point ; une cellule vide
 * vaut `0`.
 */
export const parseCell = (raw) => {
  if (raw == null || raw === '') return 0
  const value = Number(String(raw).replace(',', '.'))
  return Number.isFinite(value) ? value : 0
}

/** Échappe une valeur pour un CSV au format RFC 4180 (séparateur `DELIMITER`). */
export const csvEscape = (value) => {
  const str = value == null ? '' : String(value)
  const needsQuotes = str.includes(DELIMITER) || /["\n\r]/.test(str)
  return needsQuotes ? `"${str.replace(/"/g, '""')}"` : str
}

/**
 * Formate un nombre pour le CSV, via `formatValue` de Publicodes (convention
 * française : virgule décimale).
 *
 * Publicodes groupe les milliers avec une espace fine insécable (`U+202F`), ce
 * qui rendrait la valeur ininterprétable comme nombre par les tableurs : on la
 * retire. La virgule décimale reste correcte avec le séparateur de champ `;`.
 *
 * ex. `7738.5` => `"7738,5"` ; `0` => `"0"`.
 */
export const formatNumber = (value) =>
  formatValue(value, { language: 'fr', precision: 1 }).replace(
    /[\u202F\u00A0\s]/g,
    ''
  )
