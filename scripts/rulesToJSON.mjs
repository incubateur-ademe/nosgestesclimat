/*
Aggregates the model to an unique JSON file for each targeted language.

Command: yarn compile:rules -- [options]
*/

import fs from 'fs'
import path from 'path'
import { exit } from 'process'
import Engine from 'publicodes'
import { Piscina } from 'piscina'

import cli from './i18n/cli.js'
import utils, { t9nDir } from './i18n/utils.js'

import { addTranslationToBaseRules } from './i18n/addTranslationToBaseRules.js'

import {
	supportedRegionPath,
	supportedRegions,
	supportedRegionCodes,
} from './i18n/regionCommons.js'
import { getModelFromSource } from './getModelFromSource.js'

const { srcLang, srcFile, destLangs, destRegions, markdown } = cli.getArgs(
	`Aggregates the model to an unique JSON file.`,

	{
		source: true,
		target: true,
		model: { supportedRegionCodes },
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
				: ` ✅ The supported regions have been correctly written in: ${supportedRegionPath}`
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

function getTranslatedRules(baseRules, destLang) {
	if (destLang === srcLang) {
		return baseRules
	}
	const translatedAttrs =
		utils.readYAML(path.join(t9nDir, `translated-rules-${destLang}.yaml`)) ?? {}

	return addTranslationToBaseRules(baseRules, translatedAttrs)
}

/// ---------------------- Main ----------------------

if (markdown) {
	console.log('| Task | Status | Message |')
	console.log('|:-----|:------:|:--------|')
}

writeSupportedRegions()

const baseRules = getModelFromSource(srcFile, ['data/i18n/**'], {
	verbose: !markdown,
})

try {
	new Engine(baseRules, {
		// NOTE(@EmileRolley): warnings are ignored for now but should be examined in
		//    https://github.com/datagir/nosgestesclimat/issues/1722
		logger: { log: (_) => {}, warn: (_) => {}, err: (s) => console.error(s) },
	})
	console.log(
		markdown
			? `| Rules evaluation | :heavy_check_mark: | Ø |`
			: ' ✅ Les règles ont été évaluées sans erreur !'
	)

	const piscina = new Piscina({
		filename: new URL('./rulesToJSON.worker.mjs', import.meta.url).href,
	})
	destLangs.unshift(srcLang)
	const correctlyCompiledAndOptimizedFiles = await Promise.all(
		destLangs.flatMap((destLang) => {
			const translatedBaseRules = getTranslatedRules(baseRules, destLang)
			return destRegions.map((regionCode) => {
				try {
					return piscina.run({
						regionCode,
						destLang,
						translatedBaseRules,
						markdown,
					})
				} catch (err) {
					console.log(`Error in worker ${regionCode}-${destLang}`, err)
				}
			})
		})
	)
	if (markdown) {
		console.log(
			`| Successfully compiled and optimized rules: <br><details><summary>Expand</summary> <ul>${correctlyCompiledAndOptimizedFiles.join(
				' '
			)}</ul></details> | :heavy_check_mark: | Ø |`
		)
	}
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
		console.log(err)
	}
}
