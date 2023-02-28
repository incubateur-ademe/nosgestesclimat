const path = require('path')
const { existsSync } = require('fs')
const prompt = require('prompt-sync')()

const cli = require('./cli')
const deepl = require('./deepl')
const utils = require('./utils')

const localizedRegionModelsDir = path.resolve('./data/i18n/models/')

const { srcLang, destLangs, destRegions } = cli.getArgs(
	`Translates localized region models stored in ${localizedRegionModelsDir}.`,
	{
		source: true,
		target: true,
		model: true,
	}
)

// TODO: support multiple models
const model = destRegions[0]

const srcFile = path.join(localizedRegionModelsDir, `${model}-${srcLang}.yaml`)
const srcModel = utils.readYAML(srcFile)

// TODO: there is something to do with async/await here
const translateRule = async ([ruleName, ruleVal], destLang) => {
	const translate = async (str) => {
		return await deepl.fetchTranslation(
			str,
			srcLang.toUpperCase(),
			destLang.toUpperCase()
		)
	}
	const translateMd = async (str) => {
		return await deepl.fetchTranslationMarkdown(
			str,
			srcLang.toUpperCase(),
			destLang.toUpperCase()
		)
	}
	return [
		ruleName,
		Object.fromEntries(
			await Promise.all(
				Object.entries(ruleVal).map(async ([attr, val]) => {
					if (utils.mechanismsToTranslate.includes(attr)) {
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
						val = await val
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
				if (rule !== 'param') {
					return await translateRule(rule, destLang)
				} else {
					return rule
				}
			})
		)
	)
}

destLangs.forEach(async (destLang) => {
	const destFile = path.join(
		localizedRegionModelsDir,
		`${model}-${destLang}.yaml`
	)
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
