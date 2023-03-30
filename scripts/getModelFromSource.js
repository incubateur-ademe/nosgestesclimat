const glob = require('glob')
const yaml = require('yaml')
const fs = require('fs')
const Engine = require('publicodes').default

const importKeyword = 'importer!'

// Stores engines initialized with the rules from package
const enginesCache = {}

function getEngine(packageName, opts) {
	if (!enginesCache[packageName]) {
		if (opts?.verbose) {
			console.debug('Loading package: ', packageName)
		}
		try {
			const engine = new Engine(
				JSON.parse(
					fs.readFileSync(
						`node_modules/${packageName}/${packageName}.model.json`,
						'utf-8'
					)
				)
			)
			enginesCache[packageName] = engine
		} catch (e) {
			console.error(`Error when loading '${packageName}': ${e}`)
		}
	}
	return enginesCache[packageName]
}

function getTraversedRules(engine, rule) {
	const { traversedVariables } = engine.evaluate(rule)
	return traversedVariables.flatMap((varName) => {
		return [
			[varName, engine.getRule(varName).rawNode],
			...getTraversedRules(engine, engine.getRule(varName)),
		]
	})
}

function resolveImports(rules, opts) {
	const resolvedRules = Object.entries(rules).reduce((acc, [name, value]) => {
		if (name === importKeyword) {
			const engine = getEngine(value.depuis, opts)
			const rulesToImport = value['les règles']

			rulesToImport.forEach((ruleToImport) => {
				const rule = engine.getRule(ruleToImport, opts)
				if (!rule) {
					throw new Error(
						`La règle '${ruleToImport}' n'existe pas dans ${value.depuis}`
					)
				}
				const traversedRules = getTraversedRules(engine, rule, opts)
				traversedRules.push([ruleToImport, rule.rawNode])
				acc.push(...traversedRules)
			})
		} else {
			acc.push([name, value])
		}
		return acc
	}, [])
	return Object.fromEntries(resolvedRules)
}

/**
 * Aggregates all rules from the rules folder into a single json object (the model)
 * with the resolved dependencies.
 *
 * @param sourceFile - Pattern to match the source files to be included in the model.
 * @param ignore - Pattern to match the source files to be ignored in the model.
 */
function getModelFromSource(sourceFile, ignore, opts) {
	const res = glob.sync(sourceFile, { ignore }).reduce((model, filePath) => {
		try {
			const rules = yaml.parse(fs.readFileSync(filePath, 'utf-8'))
			const completeRules = resolveImports(rules, opts)
			return { ...model, ...completeRules }
		} catch (e) {
			console.error(`Error parsing '${filePath}':`, e)
			return model
		}
	}, {})
	return res
}

module.exports = { getModelFromSource }
