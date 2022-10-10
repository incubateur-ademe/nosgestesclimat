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

const availableLanguages = ['fr', 'en-us', 'es', 'it']
const defaultLang = availableLanguages[0]

const translator = new deepl.Translator(process.env.DEEPL_API_KEY, {
	maxRetries: 5,
	minTimeout: 2000,
})

const NO_TRANS_CHAR = ' '
const TEST_MODE = true

const fetchTranslation = async (
	text,
	sourceLang,
	targetLang,
	tagHandling = 'xml'
) => {
	if (TEST_MODE) {
		const tradOrEmpty = (t) =>
			t === NO_TRANS_CHAR ? NO_TRANS_CHAR : '[TRAD] ' + t
		return text instanceof Array ? text.map(tradOrEmpty) : tradOrEmpty(text)
	}
	const resp = await translator
		.translateText(text, sourceLang, targetLang, {
			tagHandling,
			ignoreTags: ['a', 'ignore'],
			preserveFormatting: true,
		})
		.catch((err) => {
			console.error(`Error: while fetching the request for '${text}'`)
			console.error(err)
			process.exit(-1)
		})

	return resp instanceof Array
		? resp.map((translation) => translation.text)
		: resp.text
}

const markdownToHtml = async (srcMd) => {
	const srcHtml = await nodePandoc(srcMd, [
		'-f',
		'markdown_strict',
		'-t',
		'html',
	])
	return srcHtml
}

const htmlToMarkdown = async (srcHtml) => {
	const srcMd = await nodePandoc(srcHtml, [
		'-f',
		'html',
		'-t',
		'markdown_strict',
		'--atx-headers',
	])
	return srcMd
}

const fetchTranslationMarkdown = async (srcMd, sourceLang, targetLang) => {
	const getSrcHtml = async () => {
		if (srcMd instanceof Array) {
			const srcHtml = []
			await Promise.all(
				srcMd.map(async (src) => {
					srcHtml.push(await markdownToHtml(src))
				})
			)
			return srcHtml
		} else {
			return await markdownToHtml(srcMd)
		}
	}

	const srcHtml = await getSrcHtml()
	const htmlTrans = await fetchTranslation(
		srcHtml,
		sourceLang,
		targetLang,
		'html'
	)

	if (htmlTrans instanceof Array) {
		let res = []
		await Promise.all(
			htmlTrans.map(async (src) => {
				res.push(await htmlToMarkdown(src))
			})
		)
		return res
	}
	const res = await htmlToMarkdown(htmlTrans)

	return res
}

const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	dim: '\x1b[2m',
	underscore: '\x1b[4m',
	blink: '\x1b[5m',
	reverse: '\x1b[7m',
	hidden: '\x1b[8m',
	fgBlack: '\x1b[30m',
	fgRed: '\x1b[31m',
	fgGreen: '\x1b[32m',
	fgYellow: '\x1b[33m',
	fgBlue: '\x1b[34m',
	fgMagenta: '\x1b[35m',
	fgCyan: '\x1b[36m',
	fgWhite: '\x1b[37m',
	bgBlack: '\x1b[40m',
	bgRed: '\x1b[41m',
	bgGreen: '\x1b[42m',
	bgYellow: '\x1b[43m',
	bgBlue: '\x1b[44m',
	bgMagenta: '\x1b[45m',
	bgCyan: '\x1b[46m',
	bgWhite: '\x1b[47m',
}

const withStyle = (color, text) => `${color}${text}${colors.reset}`
const printErr = (message) => console.error(withStyle(colors.fgRed, message))
const printWarn = (message) => console.warn(withStyle(colors.fgYellow, message))

const getArgs = (description) => {
	const argv = yargs
		.usage(`${description}\n\nUsage: node $0 [options]`)
		.option('force', {
			alias: 'f',
			type: 'boolean',
			description:
				'Force translation of all the keys. Its overwrites the existing translations.',
		})
		.option('source', {
			alias: 's',
			type: 'string',
			default: defaultLang,
			choices: availableLanguages,
			description: `The source language to translate from.`,
		})
		.option('file', {
			alias: 'p',
			type: 'string',
			description: `The source file to translate from inside the 'locales/pages' directory. If not specified, all the files in 'locales/pages' will be translated.`,
		})
		.option('remove', {
			alias: 'r',
			type: 'boolean',
			description: `Remove the unused keys from the translation files.`,
		})
		.option('target', {
			alias: 't',
			type: 'string',
			array: true,
			default: availableLanguages.filter((l) => l !== defaultLang),
			choices: availableLanguages,
			description: 'The target language(s) to translate to.',
		})
		.help()
		.alias('help', 'h').argv

	const srcLang = argv.source ?? defaultLang

	if (!availableLanguages.includes(srcLang)) {
		printErr(`ERROR: the language '${srcLang}' is not supported.`)
		process.exit(-1)
	}

	const destLangs = (argv.target ?? availableLanguages).filter((l) => {
		if (!availableLanguages.includes(l)) {
			printWarn(`SKIP: the language '${l}' is not supported.`)
			return false
		}
		return l !== srcLang
	})

	const srcFile = argv.file ?? 'data/**/*.yaml'

	return { srcLang, destLangs, force: argv.force, remove: argv.remove, srcFile }
}

const { srcLang, destLangs, srcFile } = getArgs(
	`Calls the DeepL API to translate the rule questions, titles, notes,
	summaries and suggestions.`
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
		return fetchTranslation(
			value,
			srcLang.toUpperCase(),
			destLang.toUpperCase(),
			'xml'
		)
	}
	const translateMarkdown = (value) => {
		return fetchTranslationMarkdown(
			value,
			srcLang.toUpperCase(),
			destLang.toUpperCase()
		)
	}

	let bar = progressBars.create(entryToTranslate.length, 0)

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
				updateTranslatedRules(rule, attr, translatedValue, refVal)
			} catch (err) {
				bar.stop()
				console.error(`Error: while fetching the request for '${rule}}':`)
				console.error(err.message)
				fs.writeFile(
					destPath,
					yaml.stringify(translatedRules, {
						sortMapEntries: true,
						blockQuote: 'literal',
					}),
					'utf8',
					(err) => {
						if (err) {
							printErr(`An error occured while writting to '${destPath}':`)
							printErr(err)
							bar.stop()
							progressBars.remove(bar)
							return
						}
						console.log(
							`${entryToTranslate.length} new translated attributes written in '${destPath}'.`
						)
					}
				)
				process.exit(-1)
			}
		})
	)
	fs.writeFile(
		destPath,
		yaml.stringify(translatedRules, {
			sortMapEntries: true,
			blockQuote: 'literal',
		}),
		'utf8',
		(err) => {
			if (err) {
				printErr(`An error occured while writting to '${destPath}':`)
				printErr(err)
				bar.stop()
				progressBars.remove(bar)
				return
			}
			console.log(
				`${entryToTranslate.length} new translated attributes written in '${destPath}'.`
			)
		}
	)
}

const main = () => {
	glob(`${srcFile}`, { ignore: ['data/translated-*.yaml'] }, (_, files) => {
		console.log(`Parsing rules of '${srcFile}'`)
		const rules = R.mergeAll(
			files.reduce((acc, filename) => {
				try {
					const data = fs.readFileSync('./' + filename, 'utf8')
					const rules = yaml.parse(data)
					return acc.concat(rules)
				} catch (err) {
					printErr('An error occured while reading the file ' + filename + '')
					printErr(err)
					exit(-1)
				}
			}, [])
		)

		destLangs.forEach(async (destLang) => {
			const destPath = `data/translated-rules-${destLang}.yaml`
			const destRules = R.mergeAll(
				yaml.parse(fs.readFileSync(destPath, 'utf8'))
			)

			console.log(`Getting missing rule for ${destLang}...`)
			const missingRules = getMissingRules(rules, destRules)

			if (0 < missingRules.length) {
				console.log(
					`Translating ${missingRules.length} new entries to ${destLang}...`
				)
				translateTo(srcLang, destLang, destPath, missingRules, destRules)
			} else {
				console.log(`Found no new entry to translate...`)
			}
		})
	})
}

// main()

module.exports = {
	getMissingRules,
	getArgs,
}
