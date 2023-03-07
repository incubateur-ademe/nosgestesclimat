/*
	Checks all rules have been translated.

	Command: yarn check:rules -- [options]
*/

const path = require('path')
const glob = require('glob')
const R = require('ramda')
const { exit } = require('process')
const prompt = require('prompt-sync')()

const cli = require('./cli')
const utils = require('./utils')

const { destLangs, srcFile, markdown } = cli.getArgs(
	`Checks all rules have been translated.`,
	{
		source: true,
		target: true,
		file: true,
		markdown: true,
		defaultSrcFile: 'data/**/*.yaml',
	}
)

const expandMissingRuleQuestion = `Do you want to log missing rules ? ${cli.styledPromptActions(
	['yes', 'no']
)}: `

glob(`${srcFile}`, { ignore: ['data/i18n/**'] }, (_, files) => {
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

	cli.printChecksResultTableHeader(markdown)

	destLangs.forEach((destLang) => {
		const destPath = `data/i18n/t9n/translated-rules-${destLang}.yaml`
		const destRules = R.mergeAll(utils.readYAML(path.resolve(destPath)))
		const missingRules = utils.getMissingRules(rules, destRules)
		const missingRuleNames = missingRules.map(
			(obj) => `${obj.rule} -> ${obj.attr}`
		)
		const nbMissing = missingRules.length
		cli.printChecksResult(
			nbMissing,
			missingRuleNames,
			'rules',
			destLang,
			markdown
		)
		if (nbMissing > 0 && 'y' === prompt(expandMissingRuleQuestion)) {
			missingRules.map(({ rule: ruleName, attr }) =>
				console.log(cli.styledRuleNameWithOptionalAttr(ruleName, attr))
			)
		}
	})
})
