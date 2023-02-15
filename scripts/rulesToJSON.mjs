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

import { compressRules } from './modelOptim.mjs'

const outputJSONPath = './public'

const t9nDir = path.resolve('data/i18n/t9n')

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

/// ---------------------- Retrieving the regions models ----------------------

const regionsModelsPath = path.resolve('data/i18n/models')
const defaultModelCode = 'FR'
const defaultRegionModelParam = {
	[defaultModelCode]: {
		nom: 'France métropolitaine',
		gentilé: 'française',
		code: defaultModelCode,
	},
}
const supportedRegionPath = path.join(outputJSONPath, `supportedRegions.json`)

//
// Reads all regions models and create a json file containing params of each region.
//
// Only XX.yaml files are read in 'data/i18n/models' directory, their are the base models.
// (XX-YY.yaml files are not read, they are the translation of the base models.)
//
// The default region and hardcoded one is FR.
//
const supportedRegions = fs
	.readdirSync(regionsModelsPath)
	.reduce((acc, filename) => {
		if (!filename.match(/([A-Z]{2})-fr.yaml/)) return acc
		try {
			const regionPath = path.join(regionsModelsPath, filename)
			const rules = utils.readYAML(regionPath)
			const params = rules['params']
			if (params === undefined) {
				console.log(
					` ❌ The file ${filename} doesn't contain a 'params' key, aborting...`
				)
				exit(-1)
			}
			return { ...acc, [rules.params.code]: params }
		} catch (err) {
			console.log(
				' ❌ An error occured while reading the file:',
				filename,
				':\n\n',
				err.message
			)
			exit(-1)
		}
	}, defaultRegionModelParam)

const supportedRegionCodes = Object.keys(supportedRegions)

const regions =
	destRegions?.filter((r) => {
		if (!supportedRegionCodes.includes(r)) {
			cli.printWarn(`[WARN] - the region '${r}' is not supported, skipping it.`)
			return false
		}
		console.log(r, '!==', defaultModelCode)
		return r !== defaultModelCode
	}) ?? supportedRegionCodes

/// ---------------------- Writting helpers ----------------------

function writeSupportedRegions() {
	try {
		fs.writeFileSync(supportedRegionPath, JSON.stringify(supportedRegions))
		console.log(
			markdown
				? `| Supported regions | :heavy_check_mark: | Ø |`
				: ` ✅ The rules have been correctly written in: ${supportedRegionPath}`
		)
	} catch (err) {
		if (markdown) {
			console.log(
				`| Supported regions | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
			)
		} else {
			console.log(
				' ❌ An error occured while writting rules in:',
				supportedRegionPath
			)
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

/// ---------------------- Main ----------------------

if (markdown) {
	console.log('| Task | Status | Message |')
	console.log('|:-----|:------:|:-------:|')
}

writeSupportedRegions()

glob(srcFile, { ignore: ['data/i18n/**'] }, (_, files) => {
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
		console.log(
			markdown
				? `| Rules evaluation | :heavy_check_mark: | Ø |`
				: ' ✅ Les règles ont été évaluées sans erreur !'
		)

		destLangs.push(srcLang)
		destLangs.forEach((destLang) => {
			const translatedBaseRules =
				destLang === srcLang
					? baseRules
					: addTranslationToBaseRules(
							baseRules,
							utils.readYAML(
								path.join(t9nDir, `translated-rules-${destLang}.yaml`)
							) ?? {}
					  )
			regions.forEach((regionCode) => {
				const localizedTranslatedBaseRules =
					regionCode === defaultModelCode
						? translatedBaseRules
						: addRegionToBaseRules(
								translatedBaseRules,
								utils.readYAML(
									path.join(
										regionsModelsPath,
										`${regionCode}-${destLang}.yaml`
									) ?? {}
								)
						  )

				const destPathWithoutExtension = path.join(
					outputJSONPath,
					`co2-model.${regionCode}-lang.${destLang}`
				)
				writeRules(
					localizedTranslatedBaseRules,
					destPathWithoutExtension + '.json',
					destLang
				)
				compressRules(destPathWithoutExtension, destLang)
			})
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
