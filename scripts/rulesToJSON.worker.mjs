import fs from 'fs'
import cli from './i18n/cli.js'
import { exit } from 'process'
import utils, { publicDir } from './i18n/utils.js'
import path from 'path'
import { addRegionToBaseRules } from './i18n/addRegionToBaseRules.js'
import { defaultModelCode, regionModelsPath } from './i18n/regionCommons.js'
import { compressRules } from './modelOptim.mjs'

function writeRules(rules, path, destLang, regionCode, markdown) {
	try {
		fs.writeFileSync(path, JSON.stringify(rules))
		if (!markdown) {
			console.log(` ✅ ${regionCode}-${destLang} written`)
		}
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

function getLocalizedRules(translatedBaseRules, regionCode, destLang) {
	if (regionCode === defaultModelCode) {
		return translatedBaseRules
	}
	try {
		const localizedAttrs = utils.readYAML(
			path.join(regionModelsPath, `${regionCode}-${destLang}.yaml`)
		)
		return addRegionToBaseRules(translatedBaseRules, localizedAttrs)
	} catch (err) {
		cli.printWarn(`[SKIPPED] - ${regionCode}-${destLang} (${err.message})`)
		return addRegionToBaseRules(translatedBaseRules, {})
	}
}

export default ({
	regionCode,
	destLang,
	translatedBaseRules,
	markdown = false,
}) => {
	const localizedTranslatedBaseRules = getLocalizedRules(
		translatedBaseRules,
		regionCode,
		destLang
	)
	const destPathWithoutExtension = path.resolve(
		path.join(publicDir, `co2-model.${regionCode}-lang.${destLang}`)
	)
	writeRules(
		localizedTranslatedBaseRules,
		destPathWithoutExtension + '.json',
		destLang,
		regionCode,
		markdown
	)
	compressRules(destPathWithoutExtension, destLang, markdown, regionCode)
	return `<li>${regionCode}-${destLang}</li>`
}
