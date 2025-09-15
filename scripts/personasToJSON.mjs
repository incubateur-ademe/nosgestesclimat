import path from 'path'
import fs from 'fs'
import c from 'ansi-colors'

import utils from '@incubateur-ademe/nosgestesclimat-scripts/utils'
import cli from '@incubateur-ademe/nosgestesclimat-scripts/cli'
import { addTranslationToBasePersonas } from './i18n/addTranslationToBasePersonas.js'
import { getPersonaExtendedSituation } from './situation/getExtendedSituationFromSituation.mjs'

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

const basePersonasWithExtendedSituation = Object.fromEntries(
  Object.entries(basePersonas).map(([personaId, personaAttrs]) => [
    personaId,
    {
      ...personaAttrs,
      extendedSituation: getPersonaExtendedSituation(personaAttrs.situation)
    }
  ])
)

writePersonas(
  basePersonasWithExtendedSituation,
  path.join(outputJSONPath, `personas-${srcLang}.json`),
  srcLang
)

destLangs.forEach((destLang) => {
  const destPath = path.join(outputJSONPath, `personas-${destLang}.json`)
  const translatedPersonasAttrs =
    utils.readYAML(path.resolve(`personas/personas-${destLang}.yaml`)) ?? {}
  const translatedPersonas = addTranslationToBasePersonas(
    basePersonasWithExtendedSituation,
    translatedPersonasAttrs
  )
  writePersonas(translatedPersonas, destPath, destLang)
})
