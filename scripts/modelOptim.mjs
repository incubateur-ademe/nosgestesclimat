// Description: contains wrappers around the constant folding optimization pass from
// 				[publiopti] to be used in the build scripts: rulesToJSON.
//
// [publiopti]: https:github.com/datagir/publiopti

import Engine from 'publicodes'
import path from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { constantFolding, disabledLogger, getRawNodes } from 'publiopti'
import { exit } from 'process'

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
	const err = constantFoldingFromJSONFile(
		jsonPathWithoutExtension + '.json',
		destPath,
		['**/translated-*.yaml'],
		([ruleName, ruleNode]) => {
			return (
				rulesToKeep.includes(ruleName) ||
				'icônes' in ruleNode.rawNode ||
				ruleNode.rawNode.type === 'notification'
			)
		}
	)
	return err
}

/**
 * Applies a constant folding optimization pass to the parsed rules from the [model] path.
 *
 * @param model Path to the folder containing the Publicodes files or to a JSON file (the extension must be '.json' then).
 * @param json Path to the JSON file target.
 * @param ignore Regexp matching files to ignore from the model tree.
 * @param toKeep Predicate function to determine which rule should be kept.
 * @param verbose Whether to log the optimization pass.
 *
 * @returns An error message if the optimization pass failed, undefined otherwise.
 */
export function constantFoldingFromJSONFile(
	model,
	jsonDestPath,
	ignore,
	toKeep,
	verbose = false
) {
	const log = verbose ? console.log : function (_) {}
	try {
		var rules

		if (path.extname(model) === '.json') {
			log('Parsing rules from the JSON file:', model)
			rules = JSON.parse(readFileSync(model, 'utf8'))
		} else {
			const modelPath = path.join(path.resolve(model), '**/*.yaml')
			log(`Parsing rules from ${modelPath}...`)
			rules = readRawRules(modelPath, ignore ?? [])
		}

		const engine = new Engine(rules, { logger: disabledLogger })

		log('Constant folding pass...')
		const foldedRules = constantFolding(engine, toKeep)

		log(`Writing in '${jsonDestPath}'...`)
		writeFileSync(jsonDestPath, JSON.stringify(getRawNodes(foldedRules)))
		throw new Error('test of an error in compilation')
	} catch (error) {
		return error
	}
}
