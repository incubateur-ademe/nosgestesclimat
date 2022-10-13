const path = require('path')
const R = require('ramda')
const fs = require('fs')

const utils = require('./i18n/utils')
const cli = require('./i18n/cli')

const outputJSONPath = './public'

const { srcLang, destLangs, markdown } = cli.getArgs(
	`Combines personas translations into a JSON file.`,
	{
		source: true,
		markdown: true,
		target: true,
	}
)

const addTranslationToBasePersonas = (basePersonas, translatedPersonas) => {
	var resPersonas = basePersonas

	Object.entries(translatedPersonas).forEach(([personaId, attrs]) => {
		Object.entries(attrs)
			.filter(([attr, _]) => !attr.endsWith(utils.LOCK_KEY_EXT))
			.forEach(([attr, transVal]) => {
				resPersonas = R.assocPath([personaId, attr], transVal, resPersonas)
			})
	})

	return resPersonas
}

const writePersonas = (personas, path, lang) => {
	fs.writeFile(path, JSON.stringify(personas), function (err) {
		if (err) {
			if (markdown) {
				console.log(
					`| Personas compilation to JSON for _${lang}_ | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
				)
			} else {
				console.error(
					` ❌ An error occured while compililing personas to JSON for ${cli.yellow(
						lang
					)}:`
				)
				console.error(err)
			}

			return -1
		}
		console.log(
			markdown
				? `| Personas compilation to JSON for _${lang}_ | :heavy_check_mark: | Ø |`
				: ` ✅ Personas compilation to JSON for ${cli.yellow(lang)}`
		)
	})
}

const basePersonas = utils.readYAML(
	path.resolve(`personas/personas-${srcLang}.yaml`)
)

writePersonas(
	basePersonas,
	path.join(outputJSONPath, `personas-${srcLang}.json`),
	srcLang
)

destLangs.forEach((destLang) => {
	const destPath = path.join(outputJSONPath, `personas-${destLang}.json`)
	const translatedPersonasAttrs =
		utils.readYAML(path.resolve(`personas/personas-${destLang}.yaml`)) ?? {}
	const translatedPersonas = addTranslationToBasePersonas(
		basePersonas,
		translatedPersonasAttrs
	)
	writePersonas(translatedPersonas, destPath, destLang)
})
