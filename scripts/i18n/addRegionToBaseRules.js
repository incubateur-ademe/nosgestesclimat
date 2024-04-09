/*
	Function used to combine region attributes (e.g. questions, titles, notes) with
	the base rules.
*/

const c = require('ansi-colors')
const utils = require('@incubateur-ademe/nosgestesclimat-scripts/utils')

const mechanismsThatCanBeOverriden = [
  // Using the [avec] mechanism allows to use custom rules without having to add them to the base rules.
  'avec'
]

const ruleNamesToIgnore = [
  // rules have to be present in the base rules to be taken into account. But we want to accept some keys (rule names) to be different.
  'params'
]

const addRegionToBaseRules = (
  baseRules,
  newRegionalRules,
  regionCode = '',
  destLang = ''
) => {
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
      if (!ruleNamesToIgnore.includes(rule)) {
        throw new Error(
          `⚠️  ${c.bold(`[${regionCode}-${destLang}]`)} ${c.yellow(rule)} is present in region model but not in base rules. 
${c.italic('(it might be a typo error in the rule name or a renamed rule in the base rules).')}`
        )
      }
      return baseRules
    }

    Object.entries(attrs).forEach(([attr, transVal]) => {
      updateBaseRules([rule, attr], transVal)
    })
  })
  return baseRules
}

module.exports = {
  addRegionToBaseRules
}
