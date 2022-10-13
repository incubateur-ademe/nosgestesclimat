/*
	Checks all personas have been translated.

	Command: yarn translate:personas:check -- [options]
*/

const path = require('path')
const glob = require('glob')
const R = require('ramda')
const fs = require('fs')
const yaml = require('yaml')
const { exit } = require('process')

const cli = require('./i18n/cli')
const utils = require('./i18n/utils')

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

if (markdown) {
	console.log(`| Language | Nb. missing translations | Status |`)
	console.log(`|:--------:|:------------------------:|:------:|`)
}

destLangs.forEach((destLang) => {
	const destPath = `personas/personas-${destLang}.yaml`
	const translatedPersonas = R.mergeAll(
		yaml.parse(fs.readFileSync(destPath, 'utf8'))
	)
	const missingRules = utils.getMissingPersonas(
		basePersonas,
		translatedPersonas
	)

	if (missingRules.length > 0) {
		console.log(
			markdown
				? `| _${destLang}_ | ${missingRules.length} | ❌ |`
				: `❌ Missing ${
						missingRules.length
				  } personas translations for ${cli.yellow(destLang)}_ !`
		)
	} else {
		console.log(
			markdown
				? `| _${destLang}_ | Ø | :heavy_check_mark: |`
				: `✅ The personas translation are up to date for ${cli.yellow(
						destLang
				  )}`
		)
	}
})
