/*
	Checks all personas have been translated.

	Command: yarn check:personas -- [options]
*/

const path = require('path')
const R = require('ramda')
const fs = require('fs')
const yaml = require('yaml')

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

	cli.printChecksResult(missingRules.length, 'personas', destLang, markdown)
})
