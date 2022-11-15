const R = require('ramda')
const path = require('path')
const utils = require('./utils')
const cli = require('./cli')
const deepl = require('./deepl')

const { srcLang, destLangs, force } = cli.getArgs(
	`Calls the DeepL API to translate the rule questions, titles, notes,
	summaries and suggestions.`,
	{ source: true, target: true, force: true }
)

const translateTo = async (
	destPath,
	destLang,
	destPersonas,
	missingTranslations
) => {
	var translatedPersonas = destPersonas

	await Promise.all(
		missingTranslations.map(async ({ personaId, attr, refVal }) => {
			const transVal = await deepl.fetchTranslation(
				refVal,
				srcLang.toUpperCase(),
				destLang.toUpperCase()
			)
			translatedPersonas = R.assocPath(
				[personaId, attr],
				transVal,
				translatedPersonas
			)
			translatedPersonas = R.assocPath(
				[personaId, attr + utils.LOCK_KEY_EXT],
				refVal,
				translatedPersonas
			)
		})
	)

	utils.writeYAML(destPath, translatedPersonas)
	console.log(
		`${cli.green(
			missingTranslations.length
		)} translations written in ${cli.yellow(destPath)}`
	)
}

const refPersonas = utils.readYAML(
	path.resolve(`personas/personas-${srcLang}.yaml`)
)

destLangs.forEach(async (destLang) => {
	console.log(
		`Translating personas from ${cli.yellow(srcLang)} to ${cli.yellow(
			destLang
		)}`
	)
	try {
		const destPath = path.resolve(`personas/personas-${destLang}.yaml`)
		const destPersonas = utils.readYAML(destPath) ?? {}
		const missingTranslations = utils.getMissingPersonas(
			refPersonas,
			destPersonas,
			force
		)

		if (0 < missingTranslations.length) {
			console.log(
				`Found ${cli.yellow(missingTranslations.length)} translations...`
			)
			translateTo(destPath, destLang, destPersonas, missingTranslations)
		} else {
			console.log(
				'Nothing to be done, all personas translations are up to date!'
			)
		}
	} catch (err) {
		cli.printErr(
			`An error occured while translating to ${cli.yellow(destLang)}:`
		)
		cli.printErr(err.message)
	}
})
