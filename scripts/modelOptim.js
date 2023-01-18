const Engine = require('publicodes').default
const path = require('path')
const { readFileSync, writeFileSync } = require('fs')
const { constantFolding, disabledLogger, getRawNodes } = require('publiopti')

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
function constantFoldingFromJSONFile(
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

		const engine = new Engine(rules, { logger: disabledLogger })

		log('Constant folding pass...')
		const foldedRules = constantFolding(engine, targets)

		log(`Writing in '${jsonDestPath}'...`)
		writeFileSync(jsonDestPath, JSON.stringify(getRawNodes(foldedRules)))
	} catch (error) {
		return error
	}
}

module.exports = {
	constantFoldingFromJSONFile,
}
