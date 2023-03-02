const path = require('path')
const { existsSync } = require('fs')
const prompt = require('prompt-sync')()

const cli = require('./cli')
const deepl = require('./deepl')
const utils = require('./utils')

const { regionModelsPath, supportedRegionCodes } = require('./regionCommons')

const { srcLang, destLangs, destRegions } = cli.getArgs(
	`Translates localized region models stored in ${regionModelsPath}.`,
	{
		source: true,
		target: true,
		model: { supportedRegionCodes },
	}
)

// TODO: support multiple models
const model = destRegions[0]

console.log('regionModelsPath', regionModelsPath)

const srcFile = path.join(regionModelsPath, `${model}-${srcLang}.yaml`)
const srcModel = utils.readYAML(srcFile)

const translateRule = async ([ruleName, ruleVal], destLang) => {
	const translate = (str) => {
		return deepl.fetchTranslation(
			str,
			srcLang.toUpperCase(),
			destLang.toUpperCase()
		)
	}
	const translateMd = (str) => {
		return deepl.fetchTranslationMarkdown(
			str,
			srcLang.toUpperCase(),
			destLang.toUpperCase()
		)
	}
	const translateAttr = async (attr, val) => {
		switch (attr) {
			case 'suggestions': {
				val = Object.fromEntries(
					await Promise.all(
						Object.entries(val).map(async ([key, val]) => {
							const translatedKey = await translate(key)
							return [translatedKey, val]
						})
					)
				)
				break
			}
			case 'mosaique': {
				val = translateRule(val, destLang)
				break
			}
			case 'description':
			case 'note': {
				val = translateMd(val)
				break
			}
			default: {
				val = translate(val)
			}
		}
		return [attr, await val]
	}
	return [
		ruleName,
		Object.fromEntries(
			await Promise.all(
				Object.entries(ruleVal).map(async ([attr, val]) => {
					if (utils.mechanismsToTranslate.includes(attr)) {
						return translateAttr(attr, val)
					}
					return [attr, val]
				})
			)
		),
	]
}

const translateModel = async (srcRules, destLang) => {
	return Object.fromEntries(
		await Promise.all(
			Object.entries(srcRules).map(async (rule) => {
				// The [params] attribute contains all informations about the region,
				// it is only stored in the [fr] translation (which is the default one),
				// so we don't need to translate it.
				if (rule !== 'params') {
					return await translateRule(rule, destLang)
				} else {
					return rule
				}
			})
		)
	)
}

destLangs.forEach(async (destLang) => {
	const destFile = path.join(regionModelsPath, `${model}-${destLang}.yaml`)
	console.log(
		'Translating',
		path.basename(srcFile),
		'to',
		path.basename(destFile)
	)
	if (existsSync(destFile)) {
		cli.printWarn(`File ${destFile} already exists.`)
		const overwrite = prompt('Overwrite? [y/N] ')
		if (overwrite !== 'y') {
			cli.printWarn('Skipping...')
			return
		}
	}
	const translatedModel = await translateModel(srcModel, destLang)
	utils.writeYAML(destFile, translatedModel)
})
