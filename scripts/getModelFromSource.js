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

// This function fixes a bug related overwritten previously redefined rules
// Example:
// importer!:
//   depuis: 'futureco-data'
//   les règles:
//     - a:
//         attr: modification
//     - b:
//         attr: modification
// In this case, without this function, if a is in traversedRules of b, the traversed rule is not the updated one and previous a modified attr is overwitten
// To be really concrete :
// importer!:
//   depuis: 'futureco-data'
//   les règles:
//     - transport . ferry . surface . garage . bas:
//         question:
//     - transport . ferry . surface . garage . haut:
//         question:
// When the case of transport . ferry . surface . garage . bas is resolved, question attr is updated to null.
// Resolving case transport . ferry . surface . garage . haut will overwrite null with the "original" value of question of transport . ferry . surface . garage . bas.
function checkMemoToIgnoreTraversedRules(traversedRules, memo) {
	traversedRules.forEach((ruleToCheck, index) => {
		if (memo.includes(ruleToCheck[0])) {
			traversedRules.splice(index, 1)
		}
	})
}

function resolveImports(rules, opts) {
	const resolvedRules = Object.entries(rules).reduce((acc, [name, value]) => {
		if (name === importKeyword) {
			const engine = getEngine(value[fromKeyword], opts)
			const rulesToImport = value[rulesKeyword]
			const modifiedRulesMemo = []

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
				checkMemoToIgnoreTraversedRules(traversedRules, modifiedRulesMemo)
				acc.push(...traversedRules)
				if (updatedRawNode !== rule.rawNode) {
					modifiedRulesMemo.push(ruleName)
				}
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
