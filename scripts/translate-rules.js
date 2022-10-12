/*
	Calls the DeepL API to translate the rule questions, titles, notes,
	summaries and suggestions.

	Command: yarn translate -- [options]
*/

const cliProgress = require('cli-progress')
const yaml = require('yaml')
const fs = require('fs')
const glob = require('glob')
const yargs = require('yargs')
const nodePandoc = require('node-pandoc-promise')
const R = require('ramda')
const { exit } = require('process')
const deepl = require('deepl-node')

const utils = require('./i18n/utils')
const cli = require('./i18n/cli')

const yellow = (str) => cli.withStyle(cli.colors.fgYellow, str)
const green = (str) => cli.withStyle(cli.colors.fgGreen, str)

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

const keysToTranslate = [
	'titre',
	'description',
	'question',
	'résumé',
	'note',
	'suggestions',
	'mosaique',
]

const areEqual = (s1, s2) => {
	return (
		JSON.stringify(s1, { sortMapEntries: true }) ===
		JSON.stringify(s2, { sortMapEntries: true })
	)
}

const getMissingRules = (srcRules, targetRules) => {
	return Object.entries(srcRules)
		.filter(([_, val]) => val !== null && val !== undefined)
		.reduce((acc, [rule, val]) => {
			let targetRule = targetRules[rule]
			const filteredValEntries = Object.entries(val).filter(([attr, val]) => {
				const mosaiqueIncludeSuggestions =
					// φ => ψ === ¬φ ∨ ψ
					'mosaique' !== attr || val.suggestions
				return (
					keysToTranslate.includes(attr) &&
					val !== '' &&
					mosaiqueIncludeSuggestions
				)
			})

			if (targetRule) {
				acc.push(
					filteredValEntries.reduce((acc, [attr, refVal]) => {
						if (keysToTranslate.includes(attr)) {
							let targetRef = targetRule[attr + '.ref']
							let hasTheSameRefValue = targetRef && targetRef === refVal

							switch (attr) {
								case 'suggestions': {
									refVal = Object.keys(refVal)
									hasTheSameRefValue = targetRef && areEqual(targetRef, refVal)
									break
								}
								case 'mosaique': {
									targetRef = targetRule[attr]?.['suggestions.ref']
									refVal = Object.keys(refVal.suggestions)
									hasTheSameRefValue =
										targetRef &&
										areEqual(targetRef.suggestions, refVal.suggestions)
									break
								}
								default:
									break
							}

							if (hasTheSameRefValue && targetRule[attr]) {
								// The rule is already translated.
								return acc
							}
							acc.push({ rule, attr, refVal })
						}
						return acc
					}, [])
				)
			} else {
				// The rule doesn't exist in the target, so all attributes need to be translated.
				acc.push(
					filteredValEntries.map(([attr, refVal]) => {
						switch (attr) {
							case 'suggestions':
								return { rule, attr, refVal: Object.keys(refVal) }
							case 'mosaique':
								return { rule, attr, refVal: Object.keys(refVal.suggestions) }
							default:
								return { rule, attr, refVal }
						}
					})
				)
			}
			return acc
		}, [])
		.flat()
}

const translateTo = async (
	srcLang,
	destLang,
	destPath,
	entryToTranslate,
	translatedRules
) => {
	const updateTranslatedRules = (rule, attr, transVal, refVal) => {
		let key = [rule, attr]
		let refKey = [rule, attr + '.ref']

		if ('mosaique' === attr) {
			key = [rule, attr, 'suggestions']
			refKey = [rule, attr, 'suggestions.ref']
		}

		translatedRules = R.assocPath(key, transVal, translatedRules)
		translatedRules = R.assocPath(refKey, refVal, translatedRules)
	}
	const translate = (value) => {
		return utils.fetchTranslation(
			value,
			srcLang.toUpperCase(),
			destLang.toUpperCase(),
			'xml'
		)
	}
	const translateMarkdown = (value) => {
		return utils.fetchTranslationMarkdown(
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
	utils.writeYAML(destPath, translatedRules)
}

glob(`${srcFile}`, { ignore: ['data/translated-*.yaml'] }, (_, files) => {
	console.log(`Parsing rules of '${srcFile}'`)
	const rules = R.mergeAll(
		files.reduce((acc, filename) => {
			try {
				const data = fs.readFileSync('./' + filename, 'utf8')
				const rules = yaml.parse(data)
				return acc.concat(rules)
			} catch (err) {
				cli.printErr('An error occured while reading the file ' + filename + '')
				cli.printErr(err)
				exit(-1)
			}
		}, [])
	)

	destLangs.forEach(async (destLang) => {
		const destPath = `data/translated-rules-${destLang}.yaml`
		const destRules = R.mergeAll(yaml.parse(fs.readFileSync(destPath, 'utf8')))

		console.log(`Getting missing rule for ${destLang}...`)
		let missingRules = getMissingRules(rules, destRules)
		missingRules = missingRules.slice(0, missingRules.length / 2)

		if (0 < missingRules.length) {
			console.log(
				`Translating ${green(missingRules.length)} new entries to ${yellow(
					destLang
				)}...`
			)

			translateTo(srcLang, destLang, destPath, missingRules, destRules)
		} else {
			console.log(`Found no new entry to translate...`)
		}
	})
})
