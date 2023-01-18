/*
	Checks all rules have been translated.

	Command: yarn check:rules -- [options]
*/

const path = require('path')
const glob = require('glob')
const R = require('ramda')
const { exit } = require('process')
const inquirer = require('inquirer')

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

const questions = [
	{
		type: 'confirm',
		name: 'expandMissingRules',
		message: 'Do you want to log missing rules ?',
		default: false,
	},
]

glob(`${srcFile}`, { ignore: ['data/translated-*.yaml'] }, (_, files) => {
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
		const destPath = `data/translated-rules-${destLang}.yaml`
		const destRules = R.mergeAll(utils.readYAML(path.resolve(destPath)))
		const missingRules = utils.getMissingRules(rules, destRules)
		const missingRuleNames = missingRules.map((obj) => obj.rule)
		const nbMissing = missingRules.length
		cli.printChecksResult(
			nbMissing,
			missingRuleNames,
			'rules',
			destLang,
			markdown
		)
		if (nbMissing > 0) {
			inquirer.prompt(questions).then((answers) => {
				answers.expandMissingRules &&
					missingRuleNames.map((rule) => cli.printWarn(rule))
			})
		}
	})
})
