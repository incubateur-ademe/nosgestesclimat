/*
	Checks all personas have been translated.

	Command: yarn check:personas -- [options]
*/

const path = require('path')
const R = require('ramda')
const fs = require('fs')
const yaml = require('yaml')
const inquirer = require('inquirer')

const cli = require('./cli')
const utils = require('./utils')

const { srcLang, destLangs, markdown } = cli.getArgs(
	`Checks all personas have been translated.
`,
	{
		source: true,
		target: true,
		markdown: true,
	}
)

const basePersonas = utils.readYAML(
	path.resolve(`personas/personas-${srcLang}.yaml`)
)

const questions = [
	{
		type: 'confirm',
		name: 'expandMissingRules',
		message: 'Do you want to log missing personas ?',
		default: false,
	},
]

cli.printChecksResultTableHeader(markdown)

destLangs.forEach((destLang) => {
	const destPath = `personas/personas-${destLang}.yaml`
	const translatedPersonas = R.mergeAll(
		yaml.parse(fs.readFileSync(destPath, 'utf8'))
	)
	const missingRules = utils.getMissingPersonas(
		basePersonas,
		translatedPersonas
	)

	const missingRuleNames = missingRules.map((obj) => obj.personaId)
	const nbMissing = missingRules.length

	cli.printChecksResult(
		nbMissing,
		missingRuleNames,
		'personas',
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
