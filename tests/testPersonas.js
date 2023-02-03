/*
  Test the rules against a set of personas and return the result for each

  Command: yarn test
*/

const Engine = require('publicodes').default

const rules = require('../public/co2-fr.json')
const personas = require('../public/personas-fr.json')

const engine = new Engine(rules)

const personasRules = Object.values(personas)
const missingVariables = Object.keys(engine.evaluate('bilan').missingVariables)

const results = {}

for (persona of personasRules) {
	const personaData = persona.data.situation || persona.data
	const validPersonaRules = Object.keys(personaData).filter((rule) =>
		missingVariables.includes(rule)
	)

	const validPersonaRulesObject = validPersonaRules.reduce(
		(acc, cur) => ({ ...acc, [cur]: personaData[cur] }),
		{}
	)
	//console.log(personaData)
	//console.log(validPersonaRulesObject)
	engine.setSituation(validPersonaRulesObject)
	results[persona.nom] = engine.evaluate('bilan').nodeValue
}
console.log(results)
