/*
	Function used to combine region attributes (e.g. questions, titles, notes) with
	the base rules.
*/

const utils = require('@incubateur-ademe/nosgestesclimat-scripts/utils')

const mechanismsThatCanBeOverriden = [
	// Using the [avec] mechanism allows to use custom rules without having to add them
	// to the base rules.
	'avec',
]

const addRegionToBaseRules = (baseRules, newRegionalRules) => {
	const updateBaseRules = (key, val) => {
		if (
			utils.objPath(key, baseRules) ||
			mechanismsThatCanBeOverriden.includes(key[1])
		) {
			baseRules = utils.customAssocPath(key, val, baseRules)
		}
	}
	Object.entries(newRegionalRules).forEach(([rule, attrs]) => {
		if (!Object.keys(baseRules).includes(rule)) {
			// TODO: to discuss about the wanted behavior.
			// Should we throw an error or just ignore the rule?
			return baseRules
		}
		Object.entries(attrs).forEach(([attr, transVal]) => {
			updateBaseRules([rule, attr], transVal)
		})
	})
	return baseRules
}

module.exports = {
	addRegionToBaseRules,
}
