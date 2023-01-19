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

const { srcLang, destLangs, srcFile } = cli.getArgs(
	`Calls the DeepL API to translate the rule questions, titles, notes,
	summaries and suggestions.`,
	{ source: true, target: true, file: true, defaultSrcFile: 'data/**/*.yaml' }
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
	let previoulsyReviewedTranslation = []

	const updateTranslatedRules = (rule, attr, transVal, refVal) => {
		let key = [rule, attr]
		let refKey = [rule, attr + utils.LOCK_KEY_EXT]
		let autoKey = [rule, attr + utils.AUTO_KEY_EXT]
		let previousKey = [rule, attr + utils.PREVIOUS_REVIEW_KEY_EXT]

		if ('mosaique' === attr) {
			key = [rule, attr, 'suggestions']
			refKey = [rule, attr, 'suggestions' + utils.LOCK_KEY_EXT]
			previousKey = [rule, attr, 'suggestions' + utils.PREVIOUS_REVIEW_KEY_EXT]
			autoKey = [rule, attr, 'suggestions' + utils.AUTO_KEY_EXT]
		}
		if (
			translatedRules &&
			translatedRules[rule] &&
			translatedRules[rule][attr + utils.AUTO_KEY_EXT] &&
			translatedRules[rule][attr] !==
				translatedRules[rule][attr + utils.AUTO_KEY_EXT]
		) {
			translatedRules = R.assocPath(
				previousKey,
				translatedRules[rule][attr],
				translatedRules
			)
			previoulsyReviewedTranslation.push(`${rule} - ${attr}`)
		}

		translatedRules = R.assocPath(key, transVal, translatedRules)
		translatedRules = R.assocPath(autoKey, transVal, translatedRules)
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
	console.log('\n')
	skippedValue.forEach(({ rule, msg }) => {
		cli.printWarn(`[SKIPPED] - ${rule}:`)
		console.log(msg)
	})
	previoulsyReviewedTranslation.forEach((rule) => {
		cli.printWarn(`[PREVIOUSLY REVIEWED] : ${rule}`)
	})

	utils.writeYAML(destPath, translatedRules)
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
