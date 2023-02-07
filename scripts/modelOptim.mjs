import Engine from 'publicodes'
import path from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { constantFolding, disabledLogger, getRawNodes } from 'publiopti'

/**
 * Applies a constant folding optimization pass to the parsed rules from the [model] path.
 *
 * @param model Path to the folder containing the Publicodes files or to a JSON file (the extension must be '.json' then).
 * @param json Path to the JSON file target.
 * @param ignore Regexp matching files to ignore from the model tree.
 * @param targets List of rules to target for the optimization pass.
 * @param verbose Whether to log the optimization pass.
 *
 * @returns An error message if the optimization pass failed, undefined otherwise.
 */
export function constantFoldingFromJSONFile(
	model,
	jsonDestPath,
	ignore,
	targets,
	verbose = true
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

		console.log(
			'[BEFORE]: alimentation . plats . végétalien . nombre:',
			rules['alimentation . plats . végétalien . nombre']
		)
		const engine = new Engine(rules, { logger: disabledLogger })

		log('Constant folding pass...')
		const foldedRules = constantFolding(engine, targets)

		console.log(
			'[AFTER]: alimentation . plats . végétalien . nombre:',
			foldedRules['alimentation . plats . végétalien . nombre']
		)
		// const local = JSON.parse(readFileSync('local-fr-opti.json'), 'utf8')
		// Object.keys(local).forEach((key) => {
		// 	if (!foldedRules[key]) {
		// 		console.log('Missing key:', key)
		// 	}
		// })

		log(`Writing in '${jsonDestPath}'...`)
		writeFileSync(jsonDestPath, JSON.stringify(getRawNodes(foldedRules)))
	} catch (error) {
		return error
	}
}
