/*
	Function used to combine translated attributes (e.g. questions, titles, notes) with
	the base rules.

	NOTE: this function is used by the RulesProvider.js file of the website.
*/

const utils = require('@incubateur-ademe/nosgestesclimat-scripts/utils')
const cli = require('@incubateur-ademe/nosgestesclimat-scripts/cli')

const attrSuffixesToIgnore = ['.lock', '.auto', '.previous_review']

const addTranslationToBaseRules = (baseRules, translatedRules) => {
  const updateBaseRules = (ruleName, attributes, val) => {
    let baseRule = baseRules[ruleName]
    if (typeof baseRule !== 'object') {
      // for rules with formula directly implemented (ex: transport . empreinte au km covoiturage: 0.2 kgCO2e/km)
      baseRules[ruleName] = { valeur: baseRules[ruleName] }
    }
    if (
      baseRule &&
      (utils.objPath([ruleName, attributes], baseRules) ||
        // When the base rule hasn't a 'titre' attribute, it is automatically
        // added during the translation process.
        // Therefore, we need to add the 'titre' attribute to the base rule.
        attributes.includes('titre'))
    ) {
      baseRules = utils.customAssocPath([ruleName, attributes], val, baseRules)
    }
  }

  const updateBaseRulesWithSuggestions = (
    baseRuleName,
    baseRuleAttributes,
    baseRuleSuggestions,
    translatedSuggestionsKeys
  ) => {
    const suggestionValues = Object.values(baseRuleSuggestions)
    const translatedSuggestions = Object.fromEntries(
      translatedSuggestionsKeys.map((translatedKey, i) => [
        translatedKey,
        suggestionValues[i]
      ])
    )
    updateBaseRules(baseRuleName, baseRuleAttributes, translatedSuggestions)
  }

  Object.entries(translatedRules).forEach(([rule, attrs]) => {
    let baseRule = baseRules[rule]
    if (baseRule !== undefined) {
      Object.entries(attrs)
        .filter(([attr, _]) =>
          attrSuffixesToIgnore.every((s) => !attr.endsWith(s))
        )
        .forEach(([attr, transVal]) => {
          switch (attr) {
            case 'suggestions': {
              updateBaseRulesWithSuggestions(
                rule,
                attr,
                baseRule.suggestions,
                transVal
              )
              break
            }
            case 'mosaique': {
              updateBaseRulesWithSuggestions(
                rule,
                [attr, 'suggestions'],
                baseRule.mosaique.suggestions,
                transVal.suggestions
              )
              break
            }
            default:
              updateBaseRules(rule, attr, transVal)
              break
          }
        })
    } else {
      cli.printWarn(
        `Il semble que la règle "${rule}", traduite, n'est plus présente dans le modèle de base. Veillez à la supprimer du fichier de traduction.`
      )
    }
  })
  return baseRules
}

module.exports = {
  addTranslationToBaseRules
}
