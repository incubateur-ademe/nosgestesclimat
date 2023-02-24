const fs = require('fs/promises')

const Engine = require('publicodes').default

function comparePersonas(country, language) {
	const localRules = fs
		.readFile(`./public/co2-model.${country}-lang.${language}.json`, {
			encoding: 'utf8',
		})
		.then((res) => JSON.parse(res))
	const localPersonas = fs
		.readFile(`./public/personas-${language}.json`, {
			encoding: 'utf8',
		})
		.then((res) => JSON.parse(res))

	const prodRules = fetch(
		`https://data.nosgestesclimat.fr/co2-model.${country}-lang.${language}.json`
	).then((res) => res.json())
	const prodPersonas = fetch(
		`https://data.nosgestesclimat.fr/personas-${language}.json`
	).then((res) => res.json())

	const allData = Promise.all([
		localRules,
		localPersonas,
		prodRules,
		prodPersonas,
	])

	allData.then((res) => {
		const localResults = testPersonas(res[0], res[1])
		const prodResults = testPersonas(res[2], res[3])
		writeResults(localResults, prodResults)
	})
}

function testPersonas(rules, personas) {
	const engine = new Engine(rules)
	const missingVariables = Object.keys(
		engine.evaluate('bilan').missingVariables
	)

	const personasRules = Object.values(personas)

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
		engine.setSituation(validPersonaRulesObject)
		results[persona.nom] = engine.evaluate('bilan').nodeValue
	}

	return results
}

function writeResults(localResults, prodResults) {
	console.log(localResults)
	console.log('| Nom | Total (PR) | Total (Prod) |')
	console.log('|:-----|:------:|:------:|')
	for (let name in localResults) {
		if (localResults[name] !== prodResults[name]) {
			console.log(
				`|${name}|${Math.round(localResults[name])} kg CO2e|${Math.round(
					prodResults[name]
				)} kg CO2e|`
			)
		}
	}
}

comparePersonas('FR', 'fr')
