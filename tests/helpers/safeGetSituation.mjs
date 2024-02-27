import c from 'ansi-colors'

/**
 * This function is used to filter the situation from the user.
 *
 * @param {Record<string, string | number} situation - The situation from the user.
 * @param {string[]} everyRules - The list of all the rules in the model.
 *
 * @returns {Record<string, string | number} - The filtered situation.
 */
export default function safeGetSituation({ situation, everyRules }) {
  const unsupportedDottedNamesFromSituation = Object.keys(situation).filter(
    (ruleName) => {
      // We check if the dotteName is a rule of the model
      if (!everyRules.includes(ruleName)) {
        console.warn(
          `${c.yellow('(warning:safeGetSituation)')} trying to use ${c.magenta(ruleName)} from the user situation: the rule doesn't exist in the model`
        )
        return true
      }
      // We check if the value from a mutliple choices question `dottedName`
      // is defined as a rule `dottedName . value` in the model.
      // If not, the value in the situation is an old option, that is not an option anymore.
      if (
        typeof situation[ruleName] === 'string' &&
        situation[ruleName] !== 'oui' &&
        situation[ruleName] !== 'non' &&
        !everyRules.includes(
          `${ruleName} . ${situation[ruleName]?.replaceAll(/^'|'$/g, '')}`
        )
      ) {
        console.warn(
          `${c.yellow('(warning:safeGetSituation)')} error trying to use ${c.magenta(ruleName)} answer from the user situation: ${c.magenta(situation[ruleName])} doesn't exist in the model`
        )
        return false
      }
      return false
    }
  )

  const filteredSituation = { ...situation }

  unsupportedDottedNamesFromSituation.map((ruleName) => {
    // If a dottedName is not supported in the model, it is dropped from the situation.
    delete filteredSituation[ruleName]
  })

  return filteredSituation
}
