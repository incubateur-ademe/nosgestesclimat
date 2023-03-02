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

const { srcLang, destLangs, srcFile, onlyUpdateLocks } = cli.getArgs(
	`Calls the DeepL API to translate the rule questions, titles, notes,
	summaries and suggestions.`,
	{
		source: true,
		target: true,
		file: true,
		onlyUpdateLocks: true,
		defaultSrcFile: 'data/**/*.yaml',
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
	translatedRules
) => {
	let previoulsyReviewedTranslations = []
	let skippedValues = []
	let skippedTranslations = []

	const updateTranslatedRules = (rule, attr, transVal, refVal) => {
		let key = [rule, attr]
		let refKey = [rule, attr + utils.LOCK_KEY_EXT]
		let autoKey = [rule, attr + utils.AUTO_KEY_EXT]
		let previousKey = [rule, attr + utils.PREVIOUS_REVIEW_KEY_EXT]
		let currentVal = translatedRules[rule] && translatedRules[rule][attr]

		if ('mosaique' === attr) {
			key = [rule, attr, 'suggestions']
			refKey = [rule, attr, 'suggestions' + utils.LOCK_KEY_EXT]
			previousKey = [rule, attr, 'suggestions' + utils.PREVIOUS_REVIEW_KEY_EXT]
			autoKey = [rule, attr, 'suggestions' + utils.AUTO_KEY_EXT]
			currentVal =
				translatedRules[rule] && translatedRules[rule][attr]['suggestions']
		}
		if (
			currentVal &&
			translatedRules[rule][attr + utils.AUTO_KEY_EXT] &&
			translatedRules[rule][attr] !==
				translatedRules[rule][attr + utils.AUTO_KEY_EXT] &&
			!onlyUpdateLocks
		) {
			// The previous translated value has been manually edited, we notify the user.
			translatedRules = R.assocPath(previousKey, currentVal, translatedRules)
			previoulsyReviewedTranslations.push(`${rule} -> ${attr}`)
		}

		if (!onlyUpdateLocks) {
			translatedRules = R.assocPath(key, transVal, translatedRules)
			translatedRules = R.assocPath(autoKey, transVal, translatedRules)
		}
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

	await Promise.all(
		Object.values(entryToTranslate).map(async ({ rule, attr, refVal }) => {
			try {
				const translatedValue = onlyUpdateLocks
					? undefined
					: 'description' === attr || 'note' === attr
					? await translateMarkdown(refVal)
					: await translate(refVal)

				bar.increment({
					msg: `Translating ${rule}...`,
					lang: destLang,
				})
				if (!translatedValue && !onlyUpdateLocks) {
					skippedValues.push({
						rule,
						msg: 'an error occurred while translating',
					})
				} else {
					if (onlyUpdateLocks) {
						skippedTranslations.push(rule)
					}
					updateTranslatedRules(rule, attr, translatedValue, refVal)
				}
			} catch (err) {
				bar.increment({
					msg: `Translating ${rule}...`,
					lang: destLang,
				})
				skippedValues.push({ rule, msg: err.message })
			}
		})
	)

	skippedTranslations.forEach((rule) => {
		cli.printInfo(
			`[INFO] - '${rule}': only the reference value has been updated`
		)
	})
	skippedValues.forEach(({ rule, msg }) => {
		cli.printWarn(`[SKIPPED] - '${rule}': ${msg}`)
	})
	previoulsyReviewedTranslations.forEach((rule) => {
		cli.printErr(
			`[PREVIOUSLY REVIEWED] - '${rule}': previous translation has been previously corrected by hand`
		)
	})
	utils.writeYAML(destPath, translatedRules)
}

glob(`${srcFile}`, { ignore: ['data/i18n/**'] }, (_, files) => {
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
		const destPath = path.resolve(
			`data/i18n/t9n/translated-rules-${destLang}.yaml`
		)
		const destRules = R.mergeAll(utils.readYAML(destPath))
		console.log(`Getting missing rule for ${destLang}...`)
		let missingRules = utils.getMissingRules(rules, destRules)

		if (0 < missingRules.length) {
			console.log(
				`Translating ${cli.green(
					missingRules.length
				)} new entries to ${cli.yellow(destLang)}...`
			)

			translateTo(srcLang, destLang, destPath, missingRules, destRules)
		} else {
			console.log(`Found no new entry to translate...`)
		}
	})
})
