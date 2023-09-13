// Description: contains wrappers around the constant folding optimization pass from
// 				[@incubateur-ademe/publicodes-tools] to be used in the build scripts: rulesToJSON.
//
// [@incubateur-ademe/publicodes-tools]: https:github.com/incubateur-ademe/publicodes-tools

import Engine from 'publicodes'
import path from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { disabledLogger, getRawNodes } from '@incubateur-ademe/publicodes-tools'
import { constantFolding } from '@incubateur-ademe/publicodes-tools/optims'

// Rule names which should be kept in the optimized model.
//
// We need to keep the rules below because they are used in the simulation
// (e.g. 'bilan' or 'actions' are used to compute the total CO2 emissions).
// We also need to keep rules which are used in the UI (e.g. 'pétrole . pleins'
// and 'pétrole . volume plein' are used to compute the total volume of fuel), and
// rules that contain the 'icônes' key.
// We also need to keep all notification rules, which are not used for compilation
// but important for thee UI.
const rulesToKeep = [
	'actions',
	'actions pétrole',
	'bilan',
	'logement . gaz',
	'logement . gaz . biogaz',
	'pétrole . pleins',
	'pétrole . volume plein',
	'transport . voiture . thermique',
	'transport . ferry . surface',
]

export function compressRules(jsonPathWithoutExtension) {
	const destPath = `${jsonPathWithoutExtension}-opti.json`
	let res = constantFoldingFromJSONFile(
		jsonPathWithoutExtension + '.json',
		destPath,
		([ruleName, ruleNode]) => {
			return (
				rulesToKeep.includes(ruleName) ||
				'icônes' in ruleNode.rawNode ||
				ruleNode.rawNode.type === 'notification'
			)
		}
	)
	return res
}

/**
 * Applies a constant folding optimization pass to the parsed rules from the [model] path.
 *
 * @param modelPath Path to the folder containing the Publicodes files or to a JSON file (the extension must be '.json' then).
 * @param json Path to the JSON file target.
 * @param toKeep Predicate function to determine which rule should be kept.
 * @param verbose If true, the function will log the steps of the optimization pass.
 *
 * @returns An error message if the optimization pass failed, undefined otherwise.
 */
export function constantFoldingFromJSONFile(
	modelPath,
	jsonDestPath,
	toKeep,
	verbose = false
) {
	const log = verbose ? console.log : function (_) {}
	try {
		log('Parsing rules from the JSON file:', modelPath)
		const rules = JSON.parse(readFileSync(modelPath, 'utf8'))
		const engine = new Engine(rules, { logger: disabledLogger })

		log('Constant folding pass...')
		const foldedRules = getRawNodes(constantFolding(engine, toKeep))

		log(`Writing in '${jsonDestPath}'...`)
		writeFileSync(jsonDestPath, JSON.stringify(foldedRules, null, 2))
		return { nbRules: Object.keys(foldedRules).length }
	} catch (error) {
		return { err }
	}
}
