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
