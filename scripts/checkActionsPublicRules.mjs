/*
	Checks that the applicability conditions of the actions only rely on rules
	marked as `public: oui`.

	An action is applicable (or not) depending on rules that the user can see in
	the public decomposition of the footprint. A condition relying on a
	non-public rule would make the action depend on a value the API user cannot see, which is a violation of the public model.

	The check runs on the rules parsed by the publicodes engine, not on the raw
	model: only the engine resolves the `avec` sub-rules and the partial
	references (`usage`, `transport . voiture . usage`, ...). The engine compiles
	the `applicable si` and `non applicable si` attributes into `condition` nodes
	whose `rawNode` still holds the original attributes, and resolves every
	reference to its full dotted name.

	Called from `rulesToJSON.mjs`, which owns the engine.
*/

import c from 'ansi-colors'
import { reduceAST } from 'publicodes'

const rootActionDottedName = 'actions'

const conditionAttributes = ['applicable si', 'non applicable si']

const isPublic = (parsedRule) => parsedRule?.rawNode?.public === 'oui'

// Returns true when the raw condition is a single `est applicable` test, i.e.
// an applicability the engine propagated from a reference of the formula.
//
// A condition written in the model as a bare rule (`applicable si: profil . est
// mineur`) is kept as a string by the engine, so it is never mistaken for a
// propagated applicability.
function isPropagatedApplicabilityFromReferenceInFormula(rawCondition) {
  if (typeof rawCondition !== 'object' || rawCondition === null) {
    return false
  }
  const keys = Object.keys(rawCondition)
  return keys.length === 1 && keys[0] === 'est applicable'
}

// Returns the `{ attribute, references }` of the applicability conditions of a
// rule, `references` being the full dotted names of the rules they depend on.
function getConditions(parsedRule) {
  const conditions = []

  reduceAST(
    (acc, node) => {
      if (node.nodeKind !== 'condition') {
        return
      }
      const attribute = conditionAttributes.find(
        (name) => node.rawNode?.[name] !== undefined
      )
      if (!attribute) {
        return
      }

      const references = []
      reduceAST(
        (refs, conditionNode) => {
          if (
            conditionNode.nodeKind === 'reference' &&
            conditionNode.dottedName
          ) {
            refs.push(conditionNode.dottedName)
          }
        },
        references,
        node.explanation?.si
      )

      if (
        isPropagatedApplicabilityFromReferenceInFormula(node.rawNode[attribute])
      ) {
        return
      }

      acc.push({ attribute, references: [...new Set(references)] })
    },
    conditions,
    parsedRule
  )

  return conditions
}

// Returns the list of the non-public rules reachable from the applicability
// conditions of `dottedName`.
//
// Only the conditions are walked: the formula of the action is not part of its
// applicability, and may legitimately rely on non-public rules.
//
// `visited` is shared between the branches of a same action so that a rule is
// only walked once. `path` is the chain of the non-public rules walked to reach
// the current rule: it is used to report where the violation comes from.
function findNonPublicConditionReferences(
  parsedRules,
  dottedName,
  visited,
  path = []
) {
  if (visited.has(dottedName)) {
    return []
  }
  visited.add(dottedName)

  const parsedRule = parsedRules[dottedName]
  if (!parsedRule) {
    return []
  }

  const errors = []

  for (const { references } of getConditions(parsedRule)) {
    for (const reference of references) {
      // A reference to a sub-rule of the current rule is not a reference to the
      // model: the sub-rule is walked instead, and its own conditions are
      // checked.
      if (reference.startsWith(`${dottedName} . `)) {
        errors.push(
          ...findNonPublicConditionReferences(
            parsedRules,
            reference,
            visited,
            path
          )
        )
        continue
      }

      if (isPublic(parsedRules[reference])) {
        continue
      }

      if (reference.startsWith(`${rootActionDottedName} . `)) {
        errors.push(
          ...findNonPublicConditionReferences(parsedRules, reference, visited, [
            ...path,
            reference
          ])
        )
        continue
      }

      errors.push({ reference, path })
    }
  }

  return errors
}

const dedupe = (errors) =>
  errors.filter(
    (error, index, all) =>
      all.findIndex(
        (other) =>
          other.action === error.action &&
          other.attribute === error.attribute &&
          other.reference === error.reference
      ) === index
  )

// Returns the list of the actions whose applicability conditions reference a
// non-public rule.
export function getNonPublicActionConditions(parsedRules) {
  return dedupe(
    Object.keys(parsedRules)
      .filter((dottedName) =>
        dottedName.startsWith(`${rootActionDottedName} . `)
      )
      .flatMap((dottedName) =>
        getConditions(parsedRules[dottedName]).flatMap(({ attribute }) =>
          findNonPublicConditionReferences(
            parsedRules,
            dottedName,
            new Set()
          ).map((error) => ({ ...error, action: dottedName, attribute }))
        )
      )
  )
}

// Returns the list of the actions whose applicability conditions rely on a rule
// marked as `ciblé: non`, i.e. a rule that is not a targeting question.
export function getNonTargetedActionConditions(parsedRules) {
  const conditions = Object.keys(parsedRules)
    .filter((dottedName) => dottedName.startsWith(`${rootActionDottedName} . `))
    .flatMap((dottedName) =>
      getConditions(parsedRules[dottedName]).flatMap(
        ({ attribute, references }) => {
          const nonTargeted = references.filter(
            (reference) => parsedRules[reference]?.rawNode?.['ciblé'] === 'non'
          )
          return nonTargeted.length > 0
            ? [{ action: dottedName, attribute, references: nonTargeted }]
            : []
        }
      )
    )

  return conditions.filter(
    (condition, index, all) =>
      all.findIndex(
        (other) =>
          other.action === condition.action &&
          other.attribute === condition.attribute &&
          other.references.join() === condition.references.join()
      ) === index
  )
}

// Logs the actions whose conditions rely on a non-targeting rule.
function logNonTargetedActionConditions(parsedRules) {
  const conditions = getNonTargetedActionConditions(parsedRules)

  if (conditions.length === 0) {
    return
  }

  console.log(
    `\nℹ️ ${c.yellow(conditions.length)} applicability condition(s) of the actions rely on a rule marked ${c.bold('ciblé: non')}:\n`
  )
  conditions.forEach(({ action, attribute, references }) => {
    console.log(
      `  ${c.magenta(action)} > ${c.cyan(attribute)} > ${references.map((reference) => c.yellow(reference)).join(', ')}`
    )
  })
}
// Logs the errors and exits the process if the check fails.
export function checkActionsPublicRules(
  parsedRules,
  { markdown = false } = {}
) {
  const errors = getNonPublicActionConditions(parsedRules)

  if (errors.length > 0) {
    if (markdown) {
      console.log(
        `| Actions applicability conditions | ❌ | <details><summary>${errors.length} non-public reference(s):</summary><br /><br /><ul>${errors
          .map(
            ({ action, attribute, reference, path }) =>
              `<li><b>${action}</b> > ${attribute} > ${path.length > 0 ? `${path.join(' > ')} > ` : ''}${reference}</li>`
          )
          .join('')}</ul></details> |`
      )
    } else {
      console.error(
        `❌ ${c.red(errors.length)} applicability condition(s) of the actions reference a non-public rule:\n`
      )
      errors.forEach(({ action, attribute, reference, path }) => {
        const via = path.length > 0 ? `${c.dim(path.join(' > '))} > ` : ''
        console.error(
          `  ${c.magenta(action)} > ${c.cyan(attribute)} > ${via}${c.yellow(reference)}`
        )
      })
      console.error(
        `\n➡️ Add ${c.bold('public: oui')} to the rules above, or use a public rule in the condition.`
      )
    }
    process.exit(1)
  }

  if (markdown) {
    console.log(`| Actions applicability conditions | :heavy_check_mark: | Ø |`)
  } else {
    console.log(
      `✅ All the applicability conditions of the actions rely on public rules`
    )
    logNonTargetedActionConditions(parsedRules)
  }
}
