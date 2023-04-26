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
		return err
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
	const werr = writeRules(
		localizedTranslatedBaseRules,
		destPathWithoutExtension + '.json',
		destLang,
		regionCode,
		markdown
	)
	if (werr) {
		if (markdown) {
			console.log(
				`| Rules compilation to JSON for the region ${regionCode} in _${destLang}_ | ❌ | <details><summary>See error:</summary><br /><br /><code>${werr}</code></details> |`
			)
			return { err: `[ERR] Compilation ${regionCode}-${destLang}` }
		} else {
			console.log(' ❌ An error occured while writting rules in:', path)
			console.log(werr.message)
		}
	}
	const cerr = compressRules(destPathWithoutExtension)
	if (cerr) {
		if (markdown) {
			console.log(
				`| Rules compression for the region ${regionCode} in _${destLang}_ | ❌ | <details><summary>See error:</summary><br />${cerr.message.replace(
					/(?:\r\n|\r|\n)/g,
					'<br/>'
				)}</details> |`
			)
			return { err: `[ERR] Optimization ${regionCode}-${destLang}` }
		} else {
			console.log(` ❌ ${regionCode}-${destLang} optimized: ${cerr.message}`)
		}
	} else if (!markdown) {
		console.log(` ✅ ${regionCode}-${destLang} optimized`)
	}
	return { ok: `<li>${regionCode}-${destLang}</li>` }
}
