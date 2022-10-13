/*
	Utils functions for parsing command line arguments via yargs.
*/

const yargs = require('yargs')
const path = require('path')

const utils = require('./utils')

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

const yellow = (str) => withStyle(colors.fgYellow, str)
const red = (str) => withStyle(colors.fgRed, str)
const green = (str) => withStyle(colors.fgGreen, str)

const getArgs = (description, opts) => {
	let args = yargs.usage(`${description}\n\nUsage: node $0 [options]`)

	if (opts.source) {
		args = args.option('source', {
			alias: 's',
			type: 'string',
			default: utils.defaultLang,
			choices: utils.availableLanguages,
			description: `The source language to translate from.`,
		})
	}
	if (opts.force) {
		args = args.option('force', {
			alias: 'f',
			type: 'boolean',
			description:
				'Force translation of all the keys. Its overwrites the existing translations.',
		})
	}
	if (opts.file) {
		args = args.option('file', {
			alias: 'p',
			type: 'string',
			description: `The source file to translate from inside the 'locales/pages' directory. If not specified, all the files in 'locales/pages' will be translated.`,
		})
	}
	if (opts.remove) {
		args = args.option('remove', {
			alias: 'r',
			type: 'boolean',
			description: `Remove the unused keys from the translation files.`,
		})
	}
	if (opts.target) {
		args = args.option('target', {
			alias: 't',
			type: 'string',
			array: true,
			default: utils.availableLanguages.filter((l) => l !== utils.defaultLang),
			choices: utils.availableLanguages,
			description: 'The target language(s) to translate to.',
		})
	}
	if (opts.markdown) {
		args = args.option('markdown', {
			alias: 'm',
			type: 'boolean',
			description: 'Prints the result in a Markdown table format.',
		})
	}

	const argv = args.help().alias('help', 'h').argv

	const srcLang = argv.source ?? utils.defaultLang

	if (!utils.availableLanguages.includes(srcLang)) {
		printErr(`ERROR: the language '${srcLang}' is not supported.`)
		process.exit(-1)
	}

	const destLangs = (argv.target ?? utils.availableLanguages).filter((l) => {
		if (!utils.availableLanguages.includes(l)) {
			printWarn(`SKIP: the language '${l}' is not supported.`)
			return false
		}
		return l !== srcLang
	})

	const srcFile = argv.file ?? opts.defaultSrcFile

	return {
		srcLang,
		destLangs,
		force: argv.force,
		remove: argv.remove,
		srcFile,
		markdown: argv.markdown,
	}
}

const exitIfError = (error, msg = undefined, progressBar = undefined) => {
	if (error) {
		if (msg) {
			printErr(msg)
		}
		printErr(error)
		if (progressBar) {
			progressBar.stop()
		}
		process.exit(-1)
	}
}

module.exports = {
	colors,
	exitIfError,
	getArgs,
	green,
	printErr,
	printWarn,
	red,
	withStyle,
	yellow,
}
