const glob = require('glob')
const yaml = require('yaml')
const fs = require('fs')
const Engine = require('publicodes').default

const IMPORT_KEYWORD = 'importer!'
const FROM_KEYWORD = 'depuis'
const RULES_KEYWORD = 'les règles'

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
		(depRuleName) =>
			!depRuleName.endsWith('$SITUATION') &&
			!acc.find(([accRuleName, _]) => accRuleName === depRuleName)
	)
	if (deps.length === 0) {
		return acc
	}
	acc.push(...deps.map((dep) => [dep, engine.getRule(dep).rawNode]))
	return deps.flatMap((varName) => {
		return getDependencies(engine, engine.getRule(varName), acc)
	})
}

/**
 * Returns the rule name and its attributes.
 *
 * @param ruleToImport - An item of the `les règles` array (string | object).
 * @returns The rule name and its attributes ([string, object][1]).
 *
 * For example, for the following `importer!` rule:
 *
 * ```
 * importer!:
 *	 depuis: 'package-name'
 *	 les règles:
 *			- ruleA
 *			- ruleB:
 *			  attr1: value1
 * ```
 *
 * We have:
 * - getRuleToImportInfos('ruleA') -> [['ruleA', {}]]
 * - getRuleToImportInfos({'ruleB': {attr1: value1}) -> [['ruleA', {attr1: value1}]]
 */

function getRuleToImportInfos(ruleToImport) {
	if (typeof ruleToImport == 'object') {
		return Object.entries(ruleToImport)
	}
	return [[ruleToImport, {}]]
}

function resolveImports(rules, opts) {
	const resolvedRules = Object.entries(rules).reduce((acc, [name, value]) => {
		if (name === IMPORT_KEYWORD) {
			const engine = getEngine(value[FROM_KEYWORD], opts)
			const rulesToImport = value[RULES_KEYWORD]

			rulesToImport?.forEach((ruleToImport) => {
				const [[ruleName, attrs]] = getRuleToImportInfos(ruleToImport)
				const rule = engine.getRule(ruleName, opts)
				if (!rule) {
					throw new Error(
						`La règle '${ruleName}' n'existe pas dans ${value[FROM_KEYWORD]}`
					)
				}
				const updatedRawNode = { ...rule.rawNode, ...attrs }
				acc.push([ruleName, updatedRawNode])
				const ruleDeps = getDependencies(engine, rule).filter(
					([ruleDepName, _]) =>
						// Avoid to overwrite the updatedRawNode
						!acc.find(([accRuleName, _]) => accRuleName === ruleDepName)
				)
				acc.push(...ruleDeps)
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
