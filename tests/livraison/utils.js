const fs = require('fs')
import { parse } from 'yaml'
import Engine from 'publicodes'

// Select properties inside an object.
// See https://dev.to/nas5w/how-to-select-or-omit-properties-from-an-object-in-javascript-3ina
function pick(obj, ...props) {
	return props.reduce(function (result, prop) {
		result[prop] = obj[prop]
		return result
	}, {})
}

function yamlToJson(filePath) {
	return parse(fs.readFileSync(filePath, 'utf8'))
}

const testOf = (yaml, publiProp, descr, inputs, output) => {
	test(`${publiProp} ${descr}`, () => {
		// Given
		const jsonRules = yamlToJson(yaml)
		const testedRule = pick(jsonRules, publiProp)

		// When
		const rule = { ...inputs, ...testedRule }
		const engine = new Engine(rule)
		const evaluated = engine.evaluate(publiProp)

		// Then
		if (Array.isArray(output)) {
			expect(evaluated.nodeValue).toBeGreaterThanOrEqual(output[0]) &&
				expect(evaluated.nodeValue).toBeLessThanOrEqual(output[1])
		} else {
			expect(evaluated.nodeValue).toEqual(output)
		}
	})
}

export { pick, yamlToJson, testOf }
