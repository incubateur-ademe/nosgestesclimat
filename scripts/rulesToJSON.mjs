/*
	Aggregates the model to an unique JSON file for each targeted language.

	Command: yarn compile:rules -- [options]
*/

import fs from 'fs'
import glob from 'glob'
import path from 'path'
import { exit } from 'process'
import { exec } from 'node:child_process'
import Engine from 'publicodes'

import utils from './i18n/utils.js'
import cli from './i18n/cli.js'

import { addTranslationToBaseRules } from './i18n/addTranslationToBaseRules.js'
import { addRegionToBaseRules } from './i18n/addRegionToBaseRules.js'

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

const suportedRegions = utils.getSupportedModels()

const regions = (destRegions ?? suportedRegions).filter((r) => {
	if (!suportedRegions.includes(r)) {
		cli.printWarn(`SKIP: the region '${r}' is not supported.`)
		return false
	}
	return r
})

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

function compressRules(jsonPathWithoutExtension, destLang) {
	const destPath = `${jsonPathWithoutExtension}-opti.json`
	const err = constantFoldingFromJSONFile(
		jsonPathWithoutExtension + '.json',
		destPath,
		['**/translated-*.yaml']
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

glob(srcFile, { ignore: ['data/i18n/**'] }, (_, files) => {
	const defaultDestPathWithoutExtension = path.join(
		outputJSONPath,
		`co2-model.fr-lang.${srcLang}.json`
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
				`co2-model.${region}-lang.fr.json`
			)
			const regionRuleAttrs =
				utils.readYAML(path.resolve(`data/i18n/models/${region}.yaml`)) ?? {}
			const rehydratedRules = addRegionToBaseRules(baseRules, regionRuleAttrs)
			writeRules(rehydratedRules, destPath, region)
		})

		destLangs.forEach((destLang) => {
			const destPathWithoutExtension = path.join(
				outputJSONPath,
				`co2-model.fr-lang.${destLang}.json`
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
