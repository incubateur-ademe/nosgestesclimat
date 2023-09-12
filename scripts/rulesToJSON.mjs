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
import { getModelFromSource } from '@incubateur-ademe/publicodes-tools/compilation'

const { srcLang, srcFile, destLangs, destRegions, markdown } = cli.getArgs(
	`Aggregates the model to an unique JSON file.`,
	{
		source: true,
		target: true,
		model: { supportedRegionCodes },
		file: true,
		defaultSrcFile: 'data/**/*.publicodes',
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
				: `✅ The supported regions have been correctly written in: ${supportedRegionPath}`
		)
	} catch (err) {
		if (markdown) {
			console.log(
				`| Supported regions | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
			)
		} else {
			console.log(
				'❌ An error occured while writting rules in:',
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

function logPublicodesError(err) {
	let lines = err.message.split('\n')
	for (let i = 0; i < 9; ++i) {
		if (lines[i]) {
			console.error('  ', lines[i])
		}
	}
	console.error('')
}

/// ---------------------- Main ----------------------

if (markdown) {
	console.log('| Task | Status | Message |')
	console.log('|:-----|:------:|:--------|')
}

writeSupportedRegions()

let baseRules

try {
	baseRules = getModelFromSource(srcFile, {
		ignore: ['data/i18n/**'],
		verbose: !markdown,
	})
} catch (err) {
	console.error(`❌ An error occured while trying to parse the base rules:\n`)
	console.error(err.message)
	exit(-1)
}

const piscina = new Piscina({
	filename: new URL('./rulesToJSON.worker.mjs', import.meta.url).href,
})

try {
	new Engine(baseRules, {
		// NOTE(@EmileRolley): warnings are ignored for now but should be examined in
		//    https://github.com/datagir/nosgestesclimat/issues/1722
		logger: { log: (_) => {}, warn: (_) => {}, err: (_) => {} },
	})
	if (!markdown) {
		console.log(
			`✅ ${
				Object.keys(baseRules).length
			} base rules have been correctly parsed`
		)
	}
} catch (err) {
	console.error(`❌ An error occured while trying to parse the base rules:\n`)
	logPublicodesError(err)
	exit(-1)
}

try {
	destLangs.unshift(srcLang)
	const resultOfCompilationAndOptim = await Promise.all(
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
					piscina.threads.forEach((thread) => thread.terminate())
				}
			})
		})
	)
	if (markdown) {
		console.log(
			`| Successfully compiled and optimized rules: <br><details><summary>Expand</summary> <ul>${resultOfCompilationAndOptim
				.map(({ ok }) => ok ?? '')
				.join(' ')}</ul></details> | :heavy_check_mark: | Ø |`
		)
	}
	const errors = resultOfCompilationAndOptim
		.map(({ err }) => err)
		.filter(Boolean)
	if (errors.length > 0) {
		errors.forEach((err) => console.error(err))
		exit(-1)
	}
} catch (err) {
	piscina.threads.forEach((thread) => thread.terminate())
}
