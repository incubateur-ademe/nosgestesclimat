/*
	Checks that the elements of a `somme` of a rule marked as
	`public` are marked as `public` too, recursively.

	The `public` attribute marks the rules that are part of the public
	decomposition of the footprint. A public rule whose decomposition contains a
	non-public rule would expose a hole in this decomposition: the check fails
	the compilation.

	Called from `rulesToJSON.mjs`, which owns the model loading.
*/

import c from 'ansi-colors'
import { utils } from 'publicodes'

// Rules exempted from the check: the `empreinte branche` rules are generated
// from the SDES data and are not part of the public decomposition, even when a
// public rule sums them.
const ignoredDottedNames = [/^empreinte branche \. /]

const isIgnored = (dottedName) =>
  ignoredDottedNames.some((pattern) => pattern.test(dottedName))

const isPublic = (rule) => rule?.public === 'oui'

// Returns the dotted names of the rules that a rule is decomposed into, ie the
// elements of its `somme`. The elements are written as partial names (`usage`,
// `transport . voiture . usage`, ...): they are resolved against the rule they
// are written in, exactly like publicodes does when it parses the model.
//
// The `mosaique` rules are skipped.
//
// A decomposition made of a single element is not a decomposition: it is a
// simple alias, and the element is not displayed as a sub-category.
//
// The elements that cannot be resolved are pushed to `unresolved`.
function getDecomposition(rules, dottedName, unresolved) {
  const rule = rules[dottedName]
  if (rule?.mosaique) {
    return []
  }

  const somme = rule?.formule?.somme ?? rule?.somme

  if (!Array.isArray(somme) || somme.length < 2) {
    return []
  }

  return somme
    .map((element) => {
      try {
        return utils.disambiguateReference(rules, dottedName, element)
      } catch {
        if (!isIgnored(element)) {
          unresolved.push({ parent: dottedName, element })
        }
        return undefined
      }
    })
    .filter(Boolean)
}

// Returns the list of the public rules reachable from `dottedName` whose
// decomposition contains at least one non-public rule. `visited` is shared
// between the branches of a same root so that a rule is only walked once.
function findNonPublicElements(rules, dottedName, visited, unresolved) {
  if (visited.has(dottedName)) {
    return []
  }
  visited.add(dottedName)

  const rule = rules[dottedName]
  if (!rule) {
    return []
  }

  const errors = []
  for (const element of getDecomposition(rules, dottedName, unresolved)) {
    const elementRule = rules[element]
    if (!elementRule || isIgnored(element)) {
      // The reference does not exist, or the rule is exempted from the check.
      continue
    }
    if (!isPublic(elementRule)) {
      errors.push({ parent: dottedName, element })
      continue
    }
    errors.push(...findNonPublicElements(rules, element, visited, unresolved))
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
// decomposition contains a non-public rule, and the pairs that could not be
// resolved by `disambiguateReference`.
export function getNonPublicElements(rules) {
  const unresolved = []

  const errors = Object.keys(rules)
    .filter((dottedName) => isPublic(rules[dottedName]))
    .flatMap((dottedName) =>
      findNonPublicElements(rules, dottedName, new Set(), unresolved)
    )

  return { errors: dedupe(errors), unresolved: dedupe(unresolved) }
}

// Logs the errors and exits the process if the check fails.
export function checkPublicRules(rules, { markdown = false } = {}) {
  const { errors, unresolved } = getNonPublicElements(rules)

  if (unresolved.length > 0) {
    if (markdown) {
      console.log(
        `| Public rules decomposition | ⚠️ | <details><summary>${unresolved.length} unresolved element(s):</summary><br /><br /><ul>${unresolved
          .map(
            ({ parent, element }) => `<li><b>${parent}</b> > ${element}</li>`
          )
          .join('')}</ul></details> |`
      )
    } else {
      console.warn(
        `⚠️ ${c.yellow(unresolved.length)} element(s) of a ${c.bold('somme')} could not be resolved by ${c.bold('disambiguateReference')} and were skipped:\n`
      )
      unresolved.forEach(({ parent, element }) => {
        console.warn(`  ${c.magenta(parent)} > ${c.yellow(element)}`)
      })
      console.warn('')
    }
  }

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
      `✅ All the elements of the public rules decompositions are public (${c.yellow(Object.keys(rules).length)} rules checked)`
    )
  }
}
