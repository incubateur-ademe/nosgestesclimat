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
const { getModelFromSource } = require('../getModelFromSource')

const { destLangs, srcFile, markdown } = cli.getArgs(
	`Checks all rules have been translated.`,
	{
		source: true,
		target: true,
		file: true,
		markdown: true,
		defaultSrcFile: 'data/**/*.publicodes',
	}
)

function manageNotUpToDateRuleTranslations(
	notUpToDateTranslationRules,
	destPath,
	destRules
) {
	let removed = false
	console.log(
		`⚠️ There are ${cli.yellow(
			notUpToDateTranslationRules.length
		)} not up-to-date rule translations:`
	)
	if (cli.askYesNo(`Do you want to log them?`)) {
		notUpToDateTranslationRules.forEach((rule) =>
			console.log(cli.styledRuleNameWithOptionalAttr(rule))
		)
	}
	switch (cli.ask(`Do you want to remove them?`, ['all', 'one', 'none'])) {
		case 'a': {
			removed = true
			notUpToDateTranslationRules.forEach((rule) => {
				delete destRules[rule]
			})
			break
		}
		case 'o': {
			notUpToDateTranslationRules.forEach((rule) => {
				if (
					cli.askYesNo(
						`Do you want to remove ${cli.styledRuleNameWithOptionalAttr(rule)}?`
					)
				) {
					removed = true
					delete destRules[rule]
				}
			})
			break
		}
		default: {
			break
		}
	}
	if (removed) {
		console.log(`Writing updated rules translations to: ${destPath}`)
		utils.writeYAML(destPath, destRules)
	}
}

const rules = getModelFromSource(srcFile, ['data/i18n/**'], {
	verbose: !markdown,
})

cli.printChecksResultTableHeader(markdown)

destLangs.forEach((destLang) => {
	const destPath = `data/i18n/t9n/translated-rules-${destLang}.yaml`
	const destRules = R.mergeAll(utils.readYAML(path.resolve(destPath)))
	const missingRules = utils.getMissingRules(rules, destRules)
	const missingRuleNames = missingRules.map((obj) =>
		markdown
			? `<li><b>${obj.rule}</b> > ${obj.attr}</li>`
			: cli.styledRuleNameWithOptionalAttr(obj.rule, obj.attr)
	)
	const nbMissing = missingRules.length

	cli.printChecksResult(
		nbMissing,
		missingRuleNames,
		'rules',
		destLang,
		markdown
	)
	if (nbMissing > 0 && cli.askYesNo(`Do you want to log missing rules?`)) {
		missingRules.map(({ rule: ruleName, attr }) =>
			console.log(cli.styledRuleNameWithOptionalAttr(ruleName, attr))
		)
	}

	const notUpToDateRuleTranslations = utils.getNotUpToDateRuleTranslations(
		rules,
		destRules
	)
	if (!markdown && notUpToDateRuleTranslations.length > 0) {
		manageNotUpToDateRuleTranslations(
			notUpToDateRuleTranslations,
			destPath,
			destRules
		)
	}
})
