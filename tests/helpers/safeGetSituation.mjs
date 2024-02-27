import c from 'ansi-colors'

/**
 * This function is used to filter the situation from the user.
 *
 * @param {Record<string, string | number} situation - The situation from the user.
 * @param {string[]} everyRules - The list of all the rules in the model.
 *
 * @returns {Record<string, string | number} - The filtered situation.
 */
export default function safeGetSituation({
  situation,
  everyRules,
  version = 'current',
  markdown = false
}) {
  const unsupportedDottedNamesFromSituation = Object.keys(situation).filter(
    (ruleName) => {
      // We check if the dotteName is a rule of the model
      if (!everyRules.includes(ruleName)) {
        if (markdown) {
          console.log(
            `- **${ruleName}** n'existe pas dans le modèle (_**${version}**_)`
          )
        } else {
          console.warn(
            `${c.yellow('(warning:safeGetSituation)')} the rule ${c.magenta(ruleName)} doesn't exist in the model (${c.green(version)})`
          )
        }
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
        if (markdown) {
          console.log(
            `- la réponse **${situation[ruleName]}** de **${ruleName}** n'existe pas dans le modèle (_**${version}**_)`
          )
        } else {
          console.warn(
            `${c.yellow('(warning:safeGetSituation)')} the value ${c.magenta(situation[ruleName])} for the rule ${c.magenta(ruleName)} doesn't exist in the model (${c.green(version)})`
          )
        }
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
