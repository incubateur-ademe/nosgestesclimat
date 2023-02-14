/*
	Aggregates the model to an unique JSON file for each targeted language.

	Command: yarn compile:rules -- [options]
*/

import fs from 'fs'
import glob from 'glob'
import path from 'path'
import { exit } from 'process'
import Engine from 'publicodes'

import cli from './i18n/cli.js'
import utils from './i18n/utils.js'

import { addRegionToBaseRules } from './i18n/addRegionToBaseRules.js'
import { addTranslationToBaseRules } from './i18n/addTranslationToBaseRules.js'

import { constantFoldingFromJSONFile } from './modelOptim.mjs'

const outputJSONPath = './public'

const { srcLang, srcFile, destLangs, destRegions, markdown } = cli.getArgs(
	`Aggregates the model to an unique JSON file.`,

	{
		source: true,
		target: true,
		model: true,
		file: true,
		defaultSrcFile: 'data/**/*.yaml',
		markdown: true,
	}
)

// The objective of supportedRegions function is to read regions models defined (only XX.yaml files) in 'data/i18n/models' and create a json file containing params of each region.
const supportedRegions = fs
	.readdirSync(path.resolve('data/i18n/models'))
	.reduce(
		(acc, filename) => {
			if (!filename.match(/([A-Z]{2}).yaml/)) return acc
			try {
				const regionPath = path.resolve(`data/i18n/models/${filename}`)
				const rules = utils.readYAML(regionPath)
				const params = rules['params']
				if (!params) {
					console.log(
						'Make sure a attribute "params" is defined in your region file'
					)
					exit(-1)
				}
				return { ...acc, [rules.params.code]: params }
			} catch (err) {
				console.log(
					' ❌ Une erreur est survenue lors de la lecture du fichier',
					filename,
					':\n\n',
					err.message
				)
				exit(-1)
			}
		},
		{
			FR: {
				nom: 'France métropolitaine',
				gentilé: 'française',
				code: 'FR',
			},
		}
	)

const supportedRegionCodes = Object.keys(supportedRegions)
const defaultModel = 'FR'

const regions = (destRegions ?? supportedRegionCodes).filter((r) => {
	if (!supportedRegionCodes.includes(r)) {
		cli.printWarn(`SKIP: the region '${r}' is not supported.`)
		return false
	}
	if (r === defaultModel) return false
	return r
})

function writeSupportedRegions() {
	const destPath = path.join(outputJSONPath, `supportedRegions.json`)
	try {
		fs.writeFileSync(destPath, JSON.stringify(supportedRegions))
		console.log(
			markdown
				? `| Supported Regions file | :heavy_check_mark: | Ø |`
				: ` ✅ The rules have been correctly written in: ${destPath}`
		)
	} catch (err) {
		if (markdown) {
			console.log(
				`| Supported Regions file | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
			)
		} else {
			console.log(' ❌ An error occured while writting rules in:', destPath)
			console.log(err.message)
		}
		exit(-1)
	}
}

function writeRules(rules, path, destLang) {
	try {
		fs.writeFileSync(path, JSON.stringify(rules))
		console.log(
			markdown
				? `| Rules compilation to JSON for _${destLang}_ | :heavy_check_mark: | Ø |`
				: ` ✅ The rules have been correctly written in: ${path}`
		)
	} catch (err) {
		if (markdown) {
			console.log(
				`| Rules compilation to JSON for _${destLang}_ | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
			)
		} else {
			console.log(' ❌ An error occured while writting rules in:', path)
			console.log(err.message)
		}
		exit(-1)
	}
}

const rulesToKeep = [
	'bilan',
	'actions',
	'transport',
	'pétrole . pleins',
	'transport . voiture . thermique',
	'logement . gaz',
	'pétrole . volume plein',
]

function compressRules(jsonPathWithoutExtension, destLang) {
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
				`| Rules compression for _${destLang}_ | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
			)
		} else {
			console.log(' ❌ An error occured while compressing rules in:', destPath)
			console.log(err)
		}
		exit(-1)
	} else {
		console.log(
			markdown
				? `| Rules compression for _${destLang}_ | :heavy_check_mark: | Ø |`
				: ` ✅ The rules have been correctly compressed in: ${destPath}`
		)
	}
}

writeSupportedRegions()
glob(srcFile, { ignore: ['data/i18n/**'] }, (_, files) => {
	const defaultDestPathWithoutExtension = path.join(
		outputJSONPath,
		`co2-model.FR-lang.${srcLang}`
	)
	const baseRules = files.reduce((acc, filename) => {
		try {
			const rules = utils.readYAML(path.resolve(filename))
			return { ...acc, ...rules }
		} catch (err) {
			console.log(
				' ❌ Une erreur est survenue lors de la lecture du fichier',
				filename,
				':\n\n',
				err.message
			)
			exit(-1)
		}
	}, {})

	try {
		new Engine(baseRules).evaluate('bilan')

		if (markdown) {
			console.log('| Task | Status | Message |')
			console.log('|:-----|:------:|:-------:|')
		}
		console.log(
			markdown
				? `| Rules evaluation | :heavy_check_mark: | Ø |`
				: ' ✅ Les règles ont été évaluées sans erreur !'
		)

		writeRules(baseRules, defaultDestPathWithoutExtension + '.json', srcLang)
		compressRules(defaultDestPathWithoutExtension, srcLang)

		regions.forEach((region) => {
			const destPath = path.join(
				outputJSONPath,
				`co2-model.${region.toUpperCase()}-lang.fr.json`
			)
			const regionRuleAttrs =
				utils.readYAML(path.resolve(`data/i18n/models/${region}.yaml`)) ?? {}
			const rehydratedRules = addRegionToBaseRules(baseRules, regionRuleAttrs)
			writeRules(rehydratedRules, destPath, region)
		})

		destLangs.forEach((destLang) => {
			const destPathWithoutExtension = path.join(
				outputJSONPath,
				`co2-model.FR-lang.${destLang}`
			)
			const destPath = destPathWithoutExtension + '.json'
			const translatedRuleAttrs =
				utils.readYAML(
					path.resolve(`data/i18n/t9n/translated-rules-${destLang}.yaml`)
				) ?? {}
			const translatedRules = addTranslationToBaseRules(
				baseRules,
				translatedRuleAttrs
			)
			writeRules(translatedRules, destPath, destLang)
			regions.forEach((region) => {
				const destPath = path.join(
					outputJSONPath,
					`co2-model.${region}-lang.${destLang}.json`
				)
				const regionRuleAttrs =
					utils.readYAML(
						path.resolve(`data/i18n/models/${region}-${destLang}.yaml`)
					) ?? {}
				const rehydratedRules = addRegionToBaseRules(
					translatedRules,
					regionRuleAttrs
				)
				writeRules(rehydratedRules, destPath, region)
			})

			compressRules(destPathWithoutExtension, destLang)
		})
	} catch (err) {
		if (markdown) {
			console.log(
				`| Rules evaluation | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
			)
			console.log(err)
		} else {
			console.log(
				' ❌ Une erreur est survenue lors de la compilation des règles:\n'
			)
			let lines = err.message.split('\n')
			for (let i = 0; i < 9; ++i) {
				if (lines[i]) {
					console.log('  ', lines[i])
				}
			}
			console.log()
		}
	}
})
