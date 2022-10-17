/*
	Checks all rules have been translated.

	Command: yarn translate:rules:check -- [options]
*/

const path = require('path')
const glob = require('glob')
const R = require('ramda')
const { exit } = require('process')

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

	if (markdown) {
		console.log(`| Language | Nb. missing translations | Status |`)
		console.log(`|:--------:|:------------------------:|:------:|`)
	}

	destLangs.forEach((destLang) => {
		const destPath = `data/translated-rules-${destLang}.yaml`
		const destRules = R.mergeAll(utils.readYAML(path.resolve(destPath)))
		const missingRules = utils.getMissingRules(rules, destRules)

		// console.log('missingRules:', missingRules)

		if (missingRules.length > 0) {
			console.log(
				markdown
					? `| _${destLang}_ | ${missingRules.length} | ❌ |`
					: `❌ Missing ${cli.red(
							missingRules.length
					  )} rules for the ${cli.yellow(destLang)} translation!`
			)
		} else {
			console.log(
				markdown
					? `| _${destLang}_ | Ø | :heavy_check_mark: |`
					: `✅ The rules translation are up to date for ${cli.yellow(
							destLang
					  )}`
			)
		}
	})
})
