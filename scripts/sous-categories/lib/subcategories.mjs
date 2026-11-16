/**
 * Éléments partagés par les scripts qui calculent les « sous catégories »
 * (`data/ui/subcategories.publicodes`) :
 *
 *   - `recomputeSubcategories.mjs` : pour toutes les simulations en base ;
 *   - `recomputeSubCategoriesForPersonas.mjs` : pour des situations de personas.
 *
 * Les deux produisent un CSV au **même format**, directement consommable par
 * `customSubcategories.mjs`.
 */

import { DELIMITER, csvEscape, formatNumber } from './csv.mjs'

export const SUB_CATEGORIES_ROOT = 'bilan . sous catégories'

/// ---------------------- Moteur ----------------------

export const silentLogger = {
  log: () => {},
  warn: () => {},
  error: () => {}
}

// Options identiques à celles utilisées côté app / serveur pour éviter les
// avertissements et les erreurs liées aux références circulaires du modèle.
export const engineOptions = {
  logger: silentLogger,
  strict: {
    situation: false,
    noOrphanRule: false,
    checkPossibleValues: false,
    noCycleRuntime: false
  },
  warn: { cyclicReferences: false, situationIssues: false }
}

/// ---------------------- Valeurs ----------------------

/**
 * Convertit une valeur Publicodes en nombre.
 *
 * Une évaluation indéfinie ou non applicable (`undefined`, `NaN`) vaut `0`
 * plutôt que `null` : dans le CSV, ces cellules doivent contenir `0`, pas une
 * valeur vide.
 */
export const toNumber = (nodeValue) =>
  typeof nodeValue === 'number' && Number.isFinite(nodeValue) ? nodeValue : 0

/**
 * Arrondit une valeur au dixième.
 *
 * `-0` est normalisé en `0` : `Math.round(-0.04 * 10) / 10` vaut `-0`, et
 * `formatValue` l'afficherait `"-0"`.
 */
export const roundToTenth = (value) => {
  const rounded = Math.round(value * 10) / 10
  return rounded === 0 ? 0 : rounded
}

/// ---------------------- Colonnes ----------------------

/**
 * Une règle est « vide » lorsqu'elle ne porte ni `formule` ni `valeur` : elle
 * ne sert que de nœud d'arborescence (ex. `bilan . sous catégories . transport`)
 * ou de simple regroupement. Ces règles sont exclues des colonnes du CSV.
 */
export const isEmptyRule = (rule) =>
  rule == null || (rule.formule === undefined && rule.valeur === undefined)

/**
 * Sépare les règles de sous catégories en colonnes évaluables et nœuds de
 * regroupement, dans l'ordre de déclaration du fichier.
 */
export function splitSubcategoryRules(rules) {
  const all = Object.keys(rules)
  return {
    all,
    columns: all.filter((name) => !isEmptyRule(rules[name])),
    empty: all.filter((name) => isEmptyRule(rules[name]))
  }
}

/// ---------------------- CSV ----------------------

/** Entête du CSV produit par les deux scripts de recalcul. */
export const buildCsvHeader = (columns) => [
  'simulationId',
  'date',
  'progression',
  'bilan',
  'bilanCoherent',
  ...columns.map(csvEscape)
]

/**
 * Construit une ligne du CSV.
 *
 * @param meta       `{ id, date, progression, bilan, isCoherent }`
 * @param columns    noms des règles de sous catégories (colonnes)
 * @param values     `Map`/objet nom de règle -> valeur numérique
 */
export const buildCsvLine = (meta, columns, values) =>
  [
    csvEscape(meta.id),
    csvEscape(meta.date),
    csvEscape(meta.progression),
    csvEscape(formatNumber(meta.bilan)),
    meta.isCoherent,
    ...columns.map((name) => csvEscape(formatNumber(values[name] ?? 0)))
  ].join(DELIMITER)
