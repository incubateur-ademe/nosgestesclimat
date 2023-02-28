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
import utils, { publicDir } from './i18n/utils.js'

import { addRegionToBaseRules } from './i18n/addRegionToBaseRules.js'
import { addTranslationToBaseRules } from './i18n/addTranslationToBaseRules.js'

import { compressRules } from './modelOptim.mjs'
import {
	supportedRegionPath,
	supportedRegions,
	defaultModelCode,
	regionsModelsPath,
} from './i18n/regionCommons.js'

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

/// ---------------------- Helper functions ----------------------

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

function writeRules(rules, path, destLang, regionCode) {
	try {
		fs.writeFileSync(path, JSON.stringify(rules))
		console.log(
			markdown
				? `| Rules compilation to JSON for the region ${regionCode} in _${destLang}_ | :heavy_check_mark: | Ø |`
				: ` ✅ The rules have been correctly written in: ${path}`
		)
	} catch (err) {
		if (markdown) {
			console.log(
				`| Rules compilation to JSON for the region ${regionCode} in _${destLang}_ | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
			)
		} else {
			console.log(' ❌ An error occured while writting rules in:', path)
			console.log(err.message)
		}
		exit(-1)
	}
}

function getTranslatedRules(baseRules, destLang) {
	if (destLang === srcLang) {
		return baseRules
	}
	const translatedAttrs =
		utils.readYAML(path.join(t9nDir, `translated-rules-${destLang}.yaml`)) ?? {}

	return addTranslationToBaseRules(baseRules, translatedAttrs)
}

function getLocalizedRules(translatedBaseRules, regionCode, destLang) {
	if (regionCode === defaultModelCode) {
		return translatedBaseRules
	}
	const localizedAttrs = utils.readYAML(
		path.join(regionsModelsPath, `${regionCode}-${destLang}.yaml`) ?? {}
	)
	return addRegionToBaseRules(translatedBaseRules, localizedAttrs)
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
		new Engine(baseRules, {
			// NOTE(@EmileRolley): warnings are ignored for now but should be examined in
			//    https://github.com/datagir/nosgestesclimat/issues/1722
			logger: { log: (_) => {}, warn: (_) => {}, err: (s) => console.error(s) },
		}).evaluate('bilan')
		console.log(
			markdown
				? `| Rules evaluation | :heavy_check_mark: | Ø |`
				: ' ✅ Les règles ont été évaluées sans erreur !'
		)

		destLangs.push(srcLang)
		destLangs.forEach((destLang) => {
			const translatedBaseRules = getTranslatedRules(baseRules, destLang)
			destRegions.forEach((regionCode) => {
				const localizedTranslatedBaseRules = getLocalizedRules(
					translatedBaseRules,
					regionCode,
					destLang
				)
				const destPathWithoutExtension = path.join(
					publicDir,
					`co2-model.${regionCode}-lang.${destLang}`
				)
				writeRules(
					localizedTranslatedBaseRules,
					destPathWithoutExtension + '.json',
					destLang,
					regionCode
				)
				compressRules(destPathWithoutExtension, destLang, markdown, regionCode)
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
