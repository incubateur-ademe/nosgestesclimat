import fs from 'fs'
import c from 'ansi-colors'
import cli from '@incubateur-ademe/nosgestesclimat-scripts/cli'
import utils from '@incubateur-ademe/nosgestesclimat-scripts/utils'
import { disabledLogger } from '@publicodes/tools'
import path from 'path'
import Engine from 'publicodes'
import { addRegionToBaseRules } from './i18n/addRegionToBaseRules.js'
import { defaultModelCode, regionModelsPath } from './i18n/regionCommons.js'
import { compressRules } from './modelOptim.mjs'

function getStyledReportString(name, verb, nbRules, duration) {
  return `✅ ${c.green(name)} ${verb} (${c.yellow(
    nbRules
  )} rules) in ${c.magenta(duration)} ms`
}

function writeRules(rules, path, destLang, regionCode, markdown) {
  try {
    const start = Date.now()
    fs.writeFileSync(path, JSON.stringify(rules))
    const timeElapsed = Date.now() - start
    if (!markdown) {
      console.log(
        getStyledReportString(
          `${regionCode}-${destLang}`,
          'written',
          Object.keys(rules).length,
          timeElapsed
        )
      )
    }
  } catch (err) {
    return err
  }
}

function getLocalizedRules(translatedBaseRules, regionCode, destLang) {
  if (regionCode === defaultModelCode) {
    return translatedBaseRules
  }
  try {
    const localizedAttrs = utils.readYAML(
      path.join(regionModelsPath, `${regionCode}-${destLang}.publicodes`)
    )

    // Minimal check to ensure that the translation is up-to-date. It should be more precise as we only check the keys and not the translations.
    if (destLang !== 'fr') {
      const frAttrs = utils.readYAML(
        path.join(regionModelsPath, `${regionCode}-fr.publicodes`)
      )
      const frKeys = Object.keys(frAttrs)
      const destLangKeys = Object.keys(localizedAttrs)

      const FRdiff = frKeys.filter((key) => !destLangKeys.includes(key))
      const destLangDiff = destLangKeys.filter((key) => !frKeys.includes(key))
      const diff = FRdiff.concat(destLangDiff)
      if (diff.length > 0) {
        throw new Error(
          `❌  ${c.bold(`[${regionCode}-${destLang}]`)} keys missing in the localized model: ${diff}. ${c.italic('Make sure the translation is up-to-date')}.'`
        )
      }
    }

    return addRegionToBaseRules(
      translatedBaseRules,
      localizedAttrs,
      regionCode,
      destLang
    )
  } catch (err) {
    throw err
  }
}

export default ({ regionCode, destLang, translatedBaseRules, opts }) => {
  const { markdown, optimDisabled, forceOptim } = opts

  const localizedTranslatedBaseRules = getLocalizedRules(
    translatedBaseRules,
    regionCode,
    destLang
  )

  const destPathWithoutExtension = path.resolve(
    `public/co2-model.${regionCode}-lang.${destLang}`
  )
  const engine = new Engine(localizedTranslatedBaseRules, {
    logger: disabledLogger
  })
  writeRules(
    localizedTranslatedBaseRules,
    destPathWithoutExtension + '.json',
    destLang,
    regionCode,
    markdown
  )

  if (!optimDisabled) {
    // By default, we disable optim for all regions except the FR model if the forceOptim flag is not set
    if (regionCode !== defaultModelCode && !forceOptim) {
      return
    }
    const start = Date.now()
    const nbRules = compressRules(engine, destPathWithoutExtension)
    const optimDuration = Date.now() - start

    if (!markdown) {
      console.log(
        getStyledReportString(
          `${regionCode}-${destLang}`,
          'optimized',
          nbRules,
          optimDuration
        )
      )
    }
  }

  return `<li>${regionCode}-${destLang}</li>`
}
