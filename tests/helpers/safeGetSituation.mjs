import c from 'ansi-colors'

/**
 * This function is used to filter the situation from the user.
 *
 * @param {Record<string, string | number} situation - The situation from the user.
 * @param {string[]} parsedRulesNames - The list of all the rules in the model.
 *
 * @returns {Record<string, string | number} - The filtered situation.
 *
 */
export default function safeGetSituation({
  situation,
  parsedRulesNames,
  version = 'current',
  markdown = false
}) {
  return Object.fromEntries(
    Object.entries(situation).filter(([ruleName, value]) => {
      // We check if the dotteName is a rule of the model
      if (!parsedRulesNames.includes(ruleName)) {
        if (markdown) {
          console.log(
            `- **${ruleName}** n'existe pas dans le modèle (_**${version}**_)`
          )
        } else {
          console.warn(
            `${c.yellow('(warning:safeGetSituation)')} the rule ${c.magenta(ruleName)} doesn't exist in the model (${c.green(version)})`
          )
        }
        return false
      }
      // We check if the value from a mutliple choices question `dottedName`
      // is defined as a rule `dottedName . value` in the model.
      // If not, the value in the situation is an old option, that is not an option anymore.
      if (
        value &&
        typeof value === 'string' &&
        value !== 'oui' &&
        value !== 'non' &&
        !parsedRulesNames.includes(
          `${ruleName} . ${value.replaceAll(/^'|'$/g, '')}`
        )
      ) {
        if (markdown) {
          console.log(
            `- la réponse **${value}** de **${ruleName}** n'existe pas dans le modèle (_**${version}**_)`
          )
        } else {
          console.warn(
            `${c.yellow('(warning:safeGetSituation)')} the value ${c.magenta(value)} for the rule ${c.magenta(ruleName)} doesn't exist in the model (${c.green(version)})`
          )
        }
        return false
      }
      return true
    })
  )
}
