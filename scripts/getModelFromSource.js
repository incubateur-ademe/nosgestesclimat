const glob = require('glob')
const yaml = require('yaml')
const fs = require('fs')
const Engine = require('publicodes').default

const importKeyword = 'importer!'
const fromKeyword = 'depuis'
const rulesKeyword = 'les règles'

const packageModelPath = (packageName) =>
	`node_modules/${packageName}/${packageName}.model.json`

// Stores engines initialized with the rules from package
const enginesCache = {}

function getEngine(packageName, opts) {
	if (!enginesCache[packageName]) {
		if (opts?.verbose) {
			console.debug(` 📦 '${packageName}' loading`)
		}
		try {
			const engine = new Engine(
				JSON.parse(fs.readFileSync(packageModelPath(packageName), 'utf-8')),
				{
					logger: {
						log: (_) => {},
						warn: (_) => {},
						err: (s) => console.error(s),
					},
				}
			)
			enginesCache[packageName] = engine
		} catch (e) {
			console.error(`Error when loading '${packageName}': ${e}`)
		}
	}
	return enginesCache[packageName]
}

function getDependencies(engine, rule, acc = []) {
	const deps = Array.from(
		engine.baseContext.referencesMaps.referencesIn.get(rule.dottedName)
	).filter(
		(ruleName) =>
			!ruleName.endsWith('$SITUATION') &&
			!acc.find(([accRuleName, _]) => accRuleName === ruleName)
	)
	if (deps.length === 0) {
		return acc
	}
	return deps.flatMap((varName) => {
		acc.push([varName, engine.getRule(varName).rawNode])
		return [...getDependencies(engine, engine.getRule(varName), acc)]
	})
}

function resolveImports(rules, opts) {
	const resolvedRules = Object.entries(rules).reduce((acc, [name, value]) => {
		if (name === importKeyword) {
			const engine = getEngine(value[fromKeyword], opts)
			const rulesToImport = value[rulesKeyword]

			rulesToImport?.forEach((ruleToImport) => {
				const [[ruleName, attrs]] =
					typeof ruleToImport == 'object'
						? Object.entries(ruleToImport)
						: [[ruleToImport, {}]]
				const rule = engine.getRule(ruleName, opts)
				if (!rule) {
					throw new Error(
						`La règle '${ruleName}' n'existe pas dans ${value[fromKeyword]}`
					)
				}
				const traversedRules = getDependencies(engine, rule)
				const updatedRawNode = { ...rule.rawNode, ...attrs }
				traversedRules.push([ruleName, updatedRawNode])
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
