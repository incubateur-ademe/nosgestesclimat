/*
	Function used to combine translated attributes (e.g. questions, titles, notes) with
	the base rules.

	NOTE: this function is used by the RulesProvider.js file of the website.
*/

const R = require('ramda')

const addTranslationToBaseRules = (baseRules, translatedRules) => {
	const updateBaseRules = (ruleName, attributes, val) => {
		const baseRule = baseRules[ruleName]
		if (
			baseRule &&
			(R.path([ruleName, attributes], baseRules) ||
				// When the base rule hasn't a 'titre' attribute, it is automatically
				// added during the translation process.
				// Therefore, we need to add the 'titre' attribute to the base rule.
				attributes.includes('titre'))
		) {
			baseRules = R.assocPath([ruleName, attributes], val, baseRules)
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
				suggestionValues[i],
			])
		)
		updateBaseRules(baseRuleName, baseRuleAttributes, translatedSuggestions)
	}

	Object.entries(translatedRules).forEach(([rule, attrs]) => {
		Object.entries(attrs)
			.filter(([attr, _]) => !attr.endsWith('.lock'))
			.forEach(([attr, transVal]) => {
				switch (attr) {
					case 'suggestions': {
						updateBaseRulesWithSuggestions(
							rule,
							attr,
							baseRules[rule].suggestions,
							transVal
						)
						break
					}
					case 'mosaique': {
						updateBaseRulesWithSuggestions(
							rule,
							[attr, 'suggestions'],
							baseRules[rule].mosaique.suggestions,
							transVal.suggestions
						)
						break
					}
					default:
						updateBaseRules(rule, attr, transVal)
						break
				}
			})
	})

	return baseRules
}

module.exports = {
	addTranslationToBaseRules,
}
