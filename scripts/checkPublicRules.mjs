/*
	Checks that the elements of a `somme` of a rule marked as
	`public` are marked as `public` too, recursively.

	The `public` attribute marks the rules that are part of the public
	decomposition of the footprint. A public rule whose decomposition contains a
	non-public rule would expose a hole in this decomposition: the check fails
	the compilation.

	The check runs on the rules parsed by the publicodes engine, not on the raw
	model: only the engine resolves the `avec` sub-rules and the partial
	references (`usage`, `transport . voiture . usage`, ...).

	Called from `rulesToJSON.mjs`, which owns the engine.
*/

import c from 'ansi-colors'
import { reduceAST } from 'publicodes'

const ignoredDottedNames = [
  /^logement \. construction$/,
  /^alimentation \. boisson$/,
  /^alimentation \. petit déjeuner$/,
  /^alimentation \. repas$/,
  /^divers \. animaux domestiques$/,
  /^divers \. loisirs$/,
  /^divers \. numérique$/,
  /^logement \. chauffage$/,
  /^logement \. construction$/,
  /^logement \. électricité$/,
  /^services sociétaux \. services publics$/,
  /^services sociétaux \. services marchands$/,
  /^transport \. avion$/,
  /^transport \. voiture$/
]

const isIgnored = (dottedName) =>
  ignoredDottedNames.some((pattern) => pattern.test(dottedName))

const isPublic = (parsedRule) => parsedRule?.rawNode?.public === 'oui'

// Returns the dotted names of the rules that a rule is decomposed into, ie the
// references of its `somme`.
//
// The `mosaique` rules are skipped: their options are not a decomposition of
// the footprint.
//
// A decomposition made of a single element is not a decomposition: it is a
// simple alias, and the element is not displayed as a sub-category.
function getDecomposition(parsedRules, dottedName) {
  const parsedRule = parsedRules[dottedName]
  if (!parsedRule || parsedRule.rawNode?.mosaique) {
    return []
  }

  const somme = parsedRule.rawNode?.formule?.somme ?? parsedRule.rawNode?.somme
  if (!Array.isArray(somme) || somme.length < 2) {
    return []
  }

  const references = []
  reduceAST(
    (acc, node) => {
      // Only the references written as an element of the `somme` are kept: the
      // AST also contains the references of the `avec` sub-rules and of the
      // mechanisms wrapping the formula.
      if (
        node.nodeKind === 'reference' &&
        node.dottedName &&
        somme.includes(node.rawNode)
      ) {
        acc.push(node.dottedName)
      }
    },
    references,
    parsedRule.explanation?.valeur
  )

  return [...new Set(references)]
}

// Returns the list of the public rules reachable from `dottedName` whose
// decomposition contains at least one non-public rule. `visited` is shared
// between the branches of a same root so that a rule is only walked once.
function findNonPublicElements(parsedRules, dottedName, visited) {
  if (visited.has(dottedName) || isIgnored(dottedName)) {
    return []
  }
  visited.add(dottedName)

  const errors = []
  for (const element of getDecomposition(parsedRules, dottedName)) {
    if (!isPublic(parsedRules[element])) {
      errors.push({ parent: dottedName, element })
      continue
    }
    errors.push(...findNonPublicElements(parsedRules, element, visited))
  }

  return errors
}

const dedupe = (pairs) =>
  pairs.filter(
    ({ parent, element }, index, all) =>
      all.findIndex(
        (pair) => pair.parent === parent && pair.element === element
      ) === index
  )

// Returns the `{ parent, element }` pairs of the public rules whose
// decomposition contains a non-public rule.
export function getNonPublicElements(parsedRules) {
  return dedupe(
    Object.keys(parsedRules)
      .filter((dottedName) => isPublic(parsedRules[dottedName]))
      .flatMap((dottedName) =>
        findNonPublicElements(parsedRules, dottedName, new Set())
      )
  )
}

// Logs the errors and exits the process if the check fails.
export function checkPublicRules(parsedRules, { markdown = false } = {}) {
  const errors = getNonPublicElements(parsedRules)

  if (errors.length > 0) {
    if (markdown) {
      console.log(
        `| Public rules decomposition | ❌ | <details><summary>${errors.length} non-public element(s):</summary><br /><br /><ul>${errors
          .map(
            ({ parent, element }) => `<li><b>${parent}</b> > ${element}</li>`
          )
          .join('')}</ul></details> |`
      )
    } else {
      console.error(
        `❌ ${c.red(errors.length)} rule(s) marked as ${c.bold('public')} have a non-public element in their decomposition:\n`
      )
      errors.forEach(({ parent, element }) => {
        console.error(`  ${c.magenta(parent)} > ${c.yellow(element)}`)
      })
      console.error(
        `\n➡️ Add ${c.bold('public: oui')} to the rules above, or remove ${c.bold('public: oui')} from their parent.`
      )
    }
    process.exit(1)
  }

  if (markdown) {
    console.log(`| Public rules decomposition | :heavy_check_mark: | Ø |`)
  } else {
    console.log(
      `✅ All the elements of the public rules decompositions are public (${c.yellow(Object.keys(parsedRules).length)} rules checked)`
    )
  }
}
