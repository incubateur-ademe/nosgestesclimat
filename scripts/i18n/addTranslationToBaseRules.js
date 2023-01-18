/*
	Function used to combine translated attributes (e.g. questions, titles, notes) with
	the base rules.

	NOTE: this function is used by the RulesProvider.js file of the website.
*/

const R = require('ramda')

const addTranslationToBaseRules = (baseRules, translatedRules) => {
	const updateBaseRules = (key, val) => {
		if (R.path(key, baseRules)) {
			// TODO: automatically remove from translated file entries which aren't anymore in the ref model.
			baseRules = R.assocPath(key, val, baseRules)
		}
	}

	const updateBaseRulesWithSuggestions = (
		baseKey,
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
		updateBaseRules(baseKey, translatedSuggestions)
	}

	Object.entries(translatedRules).forEach(([rule, attrs]) => {
		Object.entries(attrs)
			.filter(([attr, _]) => !attr.endsWith('.lock'))
			.forEach(([attr, transVal]) => {
				switch (attr) {
					case 'suggestions': {
						updateBaseRulesWithSuggestions(
							[rule, attr],
							baseRules[rule].suggestions,
							transVal
						)
						break
					}
					case 'mosaique': {
						updateBaseRulesWithSuggestions(
							[rule, attr, 'suggestions'],
							baseRules[rule].mosaique.suggestions,
							transVal.suggestions
						)
						break
					}
					default:
						updateBaseRules([rule, attr], transVal)
						break
				}
			})
	})

	return baseRules
}

module.exports = {
	addTranslationToBaseRules,
}
