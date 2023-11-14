const R = require('ramda')
const path = require('path')
const c = require('ansi-colors')
const utils = require('@incubateur-ademe/nosgestesclimat-scripts/utils')
const cli = require('@incubateur-ademe/nosgestesclimat-scripts/cli')
const deepl = require('@incubateur-ademe/nosgestesclimat-scripts/deepl')

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
  let previoulsyReviewedTranslation = []
  const updateTranslatedPersonas = (personaId, attr, transVal, refVal) => {
    let key = [personaId, attr]
    let refKey = [personaId, attr + utils.LOCK_KEY_EXT]
    let autoKey = [personaId, attr + utils.AUTO_KEY_EXT]
    let previousKey = [personaId, attr + utils.PREVIOUS_REVIEW_KEY_EXT]

    if (
      translatedPersonas &&
      translatedPersonas[personaId] &&
      translatedPersonas[personaId][attr + utils.AUTO_KEY_EXT] &&
      translatedPersonas[personaId][attr] !==
        translatedPersonas[personaId][attr + utils.AUTO_KEY_EXT]
    ) {
      translatedPersonas = R.assocPath(
        previousKey,
        translatedPersonas[personaId][attr],
        translatedPersonas
      )
      previoulsyReviewedTranslation.push(`${personaId} -> ${attr}`)
    }

    translatedPersonas = R.assocPath(key, transVal, translatedPersonas)
    translatedPersonas = R.assocPath(autoKey, transVal, translatedPersonas)
    translatedPersonas = R.assocPath(refKey, refVal, translatedPersonas)
  }

  var translatedPersonas = destPersonas

  await Promise.all(
    missingTranslations.map(async ({ personaId, attr, refVal }) => {
      const transVal = await deepl.fetchTranslation(
        refVal,
        srcLang.toUpperCase(),
        destLang.toUpperCase()
      )
      updateTranslatedPersonas(personaId, attr, transVal, refVal)
    })
  )

  previoulsyReviewedTranslation.forEach((rule) => {
    cli.printErr(`[PREVIOUSLY REVIEWED] : ${rule}`)
  })

  utils.writeYAML(destPath, translatedPersonas)
  console.log(
    `${c.green(missingTranslations.length)} translations written in ${c.yellow(
      destPath
    )}`
  )
}

const refPersonas = utils.readYAML(
  path.resolve(`personas/personas-${srcLang}.yaml`)
)

destLangs.forEach(async (destLang) => {
  console.log(
    `Translating personas from ${c.yellow(srcLang)} to ${c.yellow(destLang)}`
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
        `Found ${c.yellow(missingTranslations.length)} translations...`
      )
      translateTo(destPath, destLang, destPersonas, missingTranslations)
    } else {
      console.log(
        'Nothing to be done, all personas translations are up to date!'
      )
    }
  } catch (err) {
    cli.printErr(`An error occured while translating to ${c.yellow(destLang)}:`)
    cli.printErr(err.message)
  }
})
