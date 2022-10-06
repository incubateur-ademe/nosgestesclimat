/*
	Calls the DeepL API to translate the rule questions, titles, notes,
	summaries and suggestions.

	Command: yarn translate:rules -- [options]
*/
const yaml = require('yaml')
const fs = require('fs')
const glob = require('glob')
const yargs = require('yargs')
const R = require('ramda')
const { exit } = require('process')
const deepl = require('deepl-node')

const availableLanguages = ['fr', 'en-us', 'es', 'it']
const defaultLang = availableLanguages[0]

const translator = new deepl.Translator(process.env.DEEPL_API_KEY)

const fetchTranslation = async (
	text,
	sourceLang,
	targetLang,
	tagHandling = 'xml',
	fake = false
) => {
	if (fake) {
		const tradOrEmpty = (t) => (t === '' ? '' : '[TRAD] ' + t)
		return text instanceof Array ? text.map(tradOrEmpty) : tradOrEmpty(text)
	}
	const resp = await translator
		.translateText(text, sourceLang, targetLang, {
			tagHandling,
			ignoreTags: ['a', 'ignore'],
			preserveFormatting: true,
		})
		.catch((err) => {
			console.error(`Error: while fetching the request: ${err}`)
			process.exit(-1)
		})

	return resp instanceof Array
		? resp.map((translation) => translation.text)
		: resp.text
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

	const srcFile = argv.file ?? '**/*.yaml'

	return { srcLang, destLangs, force: argv.force, remove: argv.remove, srcFile }
}

const { srcLang, destLangs, srcFile } = getArgs(
	`Calls the DeepL API to translate the rule questions, titles, notes,
	summaries and suggestions.`
)

const keysToTranslate = ['question', 'note', 'description', 'titre']

const translateTo = async (srcLang, destLang, rules) => {
	const destFileName = `data/translated-rules-${destLang}.yaml`

	const updateRules = (idx, key, value) => {
		rules[idx] = R.assocPath(key, value, rules[idx])
	}

	const translate = (value, tagHandling = 'xml') => {
		return fetchTranslation(
			value,
			srcLang.toUpperCase(),
			destLang.toUpperCase(),
			tagHandling,
			true
		)
	}

	await Promise.all(
		rules.map(async (rule, idx) => {
			Object.entries(rule).map(async ([key, val]) => {
				// TODO: translate markdown for description
				const valKeys = Object.keys(val)
				const toTranslate = valKeys.reduce(
					(acc, key) => {
						if (keysToTranslate.includes(key)) {
							acc[key] = val[key]
							return acc
						}
						return acc
					},
					{
						question: undefined,
						note: undefined,
						description: undefined,
						titre: undefined,
					}
				)
				const translated = await translate(
					Object.entries(toTranslate).map(([_, val]) => val ?? '')
				)

				keysToTranslate.forEach((keyToTranslate, translatedIdx) => {
					const trans = translated[translatedIdx]
					if ('' !== trans) {
						updateRules(idx, [key, keyToTranslate], trans)
					}
				})

				// For suggestions, keys need to be translated not the values.
				if (valKeys.includes('suggestions')) {
					const suggestionsKeys = Object.keys(val.suggestions)
					const translatedSuggestionsKeys = await translate(suggestionsKeys)
					const translatedSuggestions = translatedSuggestionsKeys.reduce(
						(acc, translatedKey, idx) => {
							acc[translatedKey] = val.suggestions[suggestionsKeys[idx]]
							return acc
						},
						{}
					)
					updateRules(idx, [key, 'suggestions'], translatedSuggestions)
				}
			})
		})
	)
	fs.writeFile(destFileName, yaml.stringify(rules), 'utf8', (err) => {
		if (err) {
			printErr(`An error occured while writting to '${destFileName}':`)
			printErr(err)
			return
		}
		console.log(`Translated rules written in '${destFileName}'.`)
	})
}

glob(`${srcFile}`, (_, files) => {
	console.log(`Parsing rules of '${srcFile}'`)
	let rules = files.reduce((acc, filename) => {
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

	destLangs.forEach(async (destLang) => {
		translateTo(srcLang, destLang, rules)
	})
})
