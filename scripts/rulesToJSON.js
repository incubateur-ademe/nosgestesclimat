/*
	Aggregates the model to an unique JSON file for each targeted language.

	Command: yarn compile:rules -- [options]
*/

const yaml = require('yaml')
const fs = require('fs')
const glob = require('glob')
const path = require('path')
const { exit } = require('process')
const Engine = require('publicodes').default

const outputJSONPath = './public'

const {
	addTranslationToBaseRules,
} = require('./i18n/addTranslationToBaseRules')

const { srcLang, srcFile, destLangs, markdown } = getArgs(
	`Aggregates the model to an unique JSON file.`,

	{
		source: true,
		target: true,
		file: true,
		defaultSrcFile: 'data/**/*.yaml',
		markdown: true,
	}
)

const writeRules = (rules, path, destLang) => {
	fs.writeFile(path, JSON.stringify(rules), function (err) {
		if (err) {
			if (markdown) {
				console.log(
					`| Rules compilation to JSON for _${destLang}_ | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
				)
			} else {
				console.log(' ❌ An error occured while writting rules in:', path)
				console.log(err.message)
			}
			exit(-1)
		}
		console.log(
			markdown
				? `| Rules compilation to JSON for _${destLang}_ | :heavy_check_mark: | Ø |`
				: ` ✅ The rules have been correctly written in JSON in: ${path}`
		)
	})
}

glob(srcFile, { ignore: ['data/translated-*.yaml'] }, (_, files) => {
	const defaultDestPath = path.join(outputJSONPath, `co2-${srcLang}.json`)
	const baseRules = files.reduce((acc, filename) => {
		try {
			const rules = utils.readYAML(path.resolve(filename))
			return { ...acc, ...rules }
		} catch (err) {
			console.log(
				' ❌ Une erreur est survenue lors de la lecture du fichier',
				filename,
				':\n\n',
				err.message
			)
			exit(-1)
		}
	}, {})

	try {
		new Engine(baseRules).evaluate('bilan')

		if (markdown) {
			console.log('| Task | Status | Message |')
			console.log('|:-----|:------:|:-------:|')
		}
		console.log(
			markdown
				? `| Rules evaluation | :heavy_check_mark: | Ø |`
				: ' ✅ Les règles ont été évaluées sans erreur !'
		)

		writeRules(baseRules, defaultDestPath, defaultLang)

		destLangs.forEach((destLang) => {
			const destPath = path.join(outputJSONPath, `co2-${destLang}.json`)
			const translatedRuleAttrs =
				utils.readYAML(
					path.resolve(`data/translated-rules-${destLang}.yaml`)
				) ?? {}
			const translatedRules = addTranslationToBaseRules(
				baseRules,
				translatedRuleAttrs
			)
			writeRules(translatedRules, destPath, destLang)
		})
	} catch (err) {
		if (markdown) {
			console.log(
				`| Rules evaluation | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
			)
			console.log(err)
		} else {
			console.log(
				' ❌ Une erreur est survenue lors de la compilation des règles:\n'
			)
			let lines = err.message.split('\n')
			for (let i = 0; i < 9; ++i) {
				if (lines[i]) {
					console.log('  ', lines[i])
				}
			}
			console.log()
		}
	}
})
