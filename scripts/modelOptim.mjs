// Description: contains wrappers around the constant folding optimization pass from
// 				[publiopti] to be used in the build scripts: rulesToJSON.
//
// [publiopti]: https:github.com/EmileRolley/publiopti

import Engine from 'publicodes'
import path from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { constantFolding, disabledLogger, getRawNodes } from 'publiopti'

// Rule names which should be kept in the optimized model.
const rulesToKeep = [
	'bilan',
	'actions',
	'transport',
	'pétrole . pleins',
	'transport . voiture . thermique',
	'logement . gaz',
	'pétrole . volume plein',
]

export function compressRules(
	jsonPathWithoutExtension,
	destLang,
	markdown,
	regionCode
) {
	const destPath = `${jsonPathWithoutExtension}-opti.json`
	const err = constantFoldingFromJSONFile(
		jsonPathWithoutExtension + '.json',
		destPath,
		['**/translated-*.yaml'],
		([ruleName, ruleNode]) => {
			return rulesToKeep.includes(ruleName) || 'icônes' in ruleNode.rawNode
		}
	)

	if (err) {
		if (markdown) {
			console.log(
				`| Rules compression for the region ${regionCode} in _${destLang}_ | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
			)
		} else {
			console.log(' ❌ An error occured while compressing rules in:', destPath)
			console.log(err)
		}
		exit(-1)
	} else {
		console.log(
			markdown
				? `| Rules compression for the region ${regionCode} in _${destLang}_ | :heavy_check_mark: | Ø |`
				: ` ✅ The rules have been correctly compressed in: ${destPath}`
		)
	}
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
	} catch (error) {
		return error
	}
}
