const path = require('path')
const R = require('ramda')
const fs = require('fs')
const c = require('ansi-colors')

const utils = require('@incubateur-ademe/nosgestesclimat-scripts/utils')
const cli = require('@incubateur-ademe/nosgestesclimat-scripts/cli')
const {
  addTranslationToBasePersonas
} = require('./i18n/addTranslationToBasePersonas')

const outputJSONPath = './public'

const { srcLang, destLangs, markdown } = cli.getArgs(
  `Combines personas translations into a JSON file.`,
  {
    source: true,
    markdown: true,
    target: true
  }
)

const writePersonas = (personas, path, lang) => {
  fs.writeFile(path, JSON.stringify(personas), function (err) {
    if (err) {
      if (markdown) {
        console.log(
          `| Personas compilation to JSON for _${lang}_ | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
        )
      } else {
        console.error(
          ` ❌ An error occured while compililing personas to JSON for ${c.yellow(
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
        : `✅ Personas compilation to JSON for ${c.yellow(lang)}`
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
