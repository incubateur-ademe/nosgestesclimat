/*
	Utils functions for parsing command line arguments via yargs.
*/

const yargs = require('yargs')
const prompt = require('prompt-sync')()

const utils = require('./utils')

const colors = {
	reset: '\x1b[0m',
	bright: '\x1b[1m',
	dim: '\x1b[2m',
	italic: '\x1b[3m',
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
const printInfo = (message) => console.log(withStyle(colors.fgCyan, message))

const yellow = (str) => withStyle(colors.fgYellow, str)
const red = (str) => withStyle(colors.fgRed, str)
const green = (str) => withStyle(colors.fgGreen, str)
const magenta = (str) => withStyle(colors.fgMagenta, str)
const dim = (str) => withStyle(colors.dim, str)
const italic = (str) => withStyle(colors.italic, str)

const printChecksResultTableHeader = (markdown) => {
	if (markdown) {
		console.log(`| Language | Nb. missing translations | Status |`)
		console.log(`|:--------:|:------------------------:|:------:|`)
	}
}

const printChecksResult = (
	nbMissing,
	missingRuleNames,
	what,
	destLang,
	markdown
) => {
	if (nbMissing > 0) {
		console.log(
			markdown
				? `| _${destLang}_ | ${nbMissing} :arrow_down: <details><summary>Check missing rules</summary>${missingRuleNames}</details> | :x: |`
				: `❌ Missing ${red(nbMissing)} ${what} translations for ${yellow(
						destLang
				  )}!`
		)
	} else {
		console.log(
			markdown
				? `| _${destLang}_ | Ø | :heavy_check_mark: |`
				: `✅ The ${what} translation are up to date for ${yellow(destLang)}`
		)
	}
}

// TODO:
// - switch to typescript in order to specify the type of opts
// - could be cleaner
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
			description:
				opts.file.description ??
				`The source file to translate from the 'locales/pages' directory. If not specified, all the files in 'locales/pages' will be translated.`,
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
			choices: utils.availableLanguages,
			description: 'The target language(s) to translate into.',
		})
	}
	if (opts.model) {
		args = args.option('model', {
			alias: 'o',
			type: 'string',
			array: true,
			choices: opts.model.supportedRegionCodes,
			description: 'The region code model.',
		})
	}
	if (opts.markdown) {
		args = args.option('markdown', {
			alias: 'm',
			type: 'boolean',
			description: 'Prints the result in a Markdown table format.',
		})
	}
	if (opts.onlyUpdateLocks) {
		args = args.option('only-update-locks', {
			alias: 'u',
			type: 'boolean',
			description: 'Only update the lock attributes, do not translate.',
		})
	}
	if (opts.interactiveMode) {
		args = args.option('interactive-mode', {
			alias: 'i',
			type: 'boolean',
			description:
				'Launch the interactive mode, to translate one rule at a time with the possibility to only update the lock attributes.',
		})
	}

	const argv = args.help().alias('help', 'h').argv

	const srcLang = argv.source ?? utils.defaultLang

	if (!utils.availableLanguages.includes(srcLang)) {
		printErr(`ERROR: the language '${srcLang}' is not supported.`)
		process.exit(-1)
	}

	const destLangs = (argv.target ?? utils.availableLanguages).filter((l) => {
		return l !== srcLang
	})

	const destRegions = argv.model ?? opts?.model?.supportedRegionCodes

	const srcFile = argv.file ?? opts.defaultSrcFile

	return {
		srcLang,
		destLangs:
			!argv.target && opts.target === 'all'
				? utils.availableLanguages
				: destLangs,
		destRegions,
		force: argv.force,
		remove: argv.remove,
		srcFile,
		markdown: argv.markdown,
		onlyUpdateLocks: argv.onlyUpdateLocks,
		interactiveMode: argv.interactiveMode,
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

const styledRuleNameWithOptionalAttr = (ruleName, attr) =>
	`${magenta(ruleName)}${
		attr !== undefined ? ` ${dim('>')} ${yellow(attr)}` : ''
	}`

const styledPromptAction = (action) =>
	`[${action[0]}]${dim(action.substring(1))}`

const styledPromptActions = (actions, sep = ' ') =>
	actions.map((action) => styledPromptAction(action)).join(sep)

const promptYesNo = (question) => {
	return 'y' === prompt(`${question} (${styledPromptActions(['yes', 'no'])}) `)
}

module.exports = {
	colors,
	dim,
	italic,
	exitIfError,
	getArgs,
	green,
	magenta,
	printErr,
	printWarn,
	printInfo,
	red,
	withStyle,
	yellow,
	printChecksResult,
	printChecksResultTableHeader,
	styledRuleNameWithOptionalAttr,
	styledPromptAction,
	styledPromptActions,
	promptYesNo,
}
