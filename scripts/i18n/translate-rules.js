/*
	Calls the DeepL API to translate the rule questions, titles, notes,
	summaries and suggestions.

	Command: yarn translate -- [options]
*/

const path = require('path')
const cliProgress = require('cli-progress')
const glob = require('glob')
const R = require('ramda')
const { exit } = require('process')

const utils = require('./utils')
const cli = require('./cli')
const deepl = require('./deepl')
const { basename } = require('path')

const { srcLang, destLangs, srcFile, remove } = cli.getArgs(
	`Calls the DeepL API to translate the rule questions, titles, notes,
	summaries and suggestions.`,
	{
		source: true,
		target: true,
		file: true,
		defaultSrcFile: 'data/**/*.yaml',
		remove: true,
	}
)

const progressBars = new cliProgress.MultiBar(
	{
		stopOnComplete: true,
		clearOnComplete: true,
		forceRedraw: true,
		format: '{lang} | {value}/{total} | {bar} | {msg} ',
	},
	cliProgress.Presets.shades_grey
)

const translateTo = async (
	srcLang,
	destLang,
	destPath,
	entryToTranslate,
	translatedRules,
	frenchRules
) => {
	const updateTranslatedRules = (rule, attr, transVal, refVal) => {
		let key = [rule, attr]
		let refKey = [rule, attr + utils.LOCK_KEY_EXT]

		if ('mosaique' === attr) {
			key = [rule, attr, 'suggestions']
			refKey = [rule, attr, 'suggestions' + utils.LOCK_KEY_EXT]
		}

		translatedRules = R.assocPath(key, transVal, translatedRules)
		translatedRules = R.assocPath(refKey, refVal, translatedRules)
	}
	const translate = (value) => {
		return deepl.fetchTranslation(
			value,
			srcLang.toUpperCase(),
			destLang.toUpperCase()
		)
	}
	const translateMarkdown = (value) => {
		return deepl.fetchTranslationMarkdown(
			value,
			srcLang.toUpperCase(),
			destLang.toUpperCase()
		)
	}

	let bar = progressBars.create(entryToTranslate.length, 0)
	let skippedValue = []

	await Promise.all(
		Object.values(entryToTranslate).map(async ({ rule, attr, refVal }) => {
			try {
				const translatedValue =
					'description' === attr || 'note' === attr
						? await translateMarkdown(refVal)
						: await translate(refVal)
				bar.increment({
					msg: `Translating ${rule}...`,
					lang: destLang,
				})
				if (!translatedValue) {
					skippedValue.push({
						rule,
						msg: 'an error occurred while translating',
					})
				} else {
					updateTranslatedRules(rule, attr, translatedValue, refVal)
				}
			} catch (err) {
				bar.increment({
					msg: `Translating ${rule}...`,
					lang: destLang,
				})
				skippedValue.push({ rule, msg: err.message })
			}
		})
	)
	skippedValue.forEach(({ rule, msg }) => {
		cli.printWarn(`[SKIPPED] - ${rule}:`)
		console.log(msg)
	})
}

function removeUnusedKeys(baseRules, targetRules) {
	const frRuleKeys = Object.keys(baseRules)
	return Object.fromEntries(
		Object.entries(targetRules).filter(([key]) => {
			if (!frRuleKeys.includes(key)) {
				console.log(`[REMOVED] - ${key}`)
			}
			return frRuleKeys.includes(key)
		})
	)
}

glob(`${srcFile}`, { ignore: ['data/translated-*.yaml'] }, (_, files) => {
	console.log(`Parsing rules of '${srcFile}'`)
	const rules = R.mergeAll(
		files.reduce((acc, filename) => {
			try {
				return acc.concat(utils.readYAML(filename))
			} catch (err) {
				cli.printErr('An error occured while reading the file ' + filename + '')
				cli.printErr(err)
				exit(-1)
			}
		}, [])
	)

	destLangs.forEach(async (destLang) => {
		const destPath = path.resolve(`data/translated-rules-${destLang}.yaml`)
		const destRules = R.mergeAll(utils.readYAML(destPath))
		let translatedRules = R.clone(destRules)

		console.log(`Getting missing rule for ${destLang}...`)
		let missingRules = utils.getMissingRules(rules, destRules)

		if (0 < missingRules.length) {
			console.log(
				`Translating ${cli.green(
					missingRules.length
				)} new entries to ${cli.yellow(destLang)}...`
			)

			translatedRules = translateTo(
				srcLang,
				destLang,
				destPath,
				missingRules,
				destRules,
				rules
			)
		} else {
			console.log(`Found no new entry to translate...`)
		}
		utils.writeYAML(
			destPath,
			remove ? removeUnusedKeys(rules, translatedRules) : translatedRules
		)
	})
})
