/*
	Checks all rules have been translated.

	Command: yarn check:rules -- [options]
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

		cli.printChecksResult(missingRules.length, 'rules', destLang, markdown)
	})
})
