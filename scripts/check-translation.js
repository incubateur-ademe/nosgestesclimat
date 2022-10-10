/*
	Checks all rules have been translated.

	Command: yarn translate:check -- [options]
*/

const glob = require('glob')
const R = require('ramda')
const fs = require('fs')
const yaml = require('yaml')
const yargs = require('yargs')
const { exit, exitCode } = require('process')

const availableLanguages = ['fr', 'en-us', 'es', 'it']
const defaultLang = availableLanguages[0]

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
		.option('markdown', {
			alias: 'm',
			type: 'boolean',
			description: `Prints the result in a Markdown table.`,
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

	return {
		srcLang,
		destLangs,
		force: argv.force,
		remove: argv.remove,
		srcFile,
		markdown: argv.markdown,
	}
}

const { srcLang, destLangs, srcFile, markdown } = getArgs(
	`Checks all rules have been translated.`
)

glob(`${srcFile}`, { ignore: ['data/translated-*.yaml'] }, (_, files) => {
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

	if (markdown) {
		console.log(`| Language | Nb. missing translations | Status |`)
		console.log(`|:--------:|:------------------------:|:------:|`)
	}

	destLangs.forEach((destLang) => {
		const destPath = `data/translated-rules-${destLang}.yaml`
		const destRules = R.mergeAll(yaml.parse(fs.readFileSync(destPath, 'utf8')))
		const missingRules = getMissingRules(rules, destRules)

		if (missingRules.length > 0) {
			console.log(
				markdown
					? `| ${destLang} | ${missingRules.length} | ❌ |`
					: `❌ Missing ${missingRules.length} rules for the '${destLang}' translation!`
			)
		} else {
			console.log(
				markdown
					? `| ${destLang} | Ø | ✅ |`
					: `✅ The rules translation are up to date for: ${destLang}`
			)
		}
	})
})
