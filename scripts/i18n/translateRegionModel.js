const path = require('path')
const { existsSync } = require('fs')
const prompt = require('prompt-sync')()

const cli = require('@incubateur-ademe/nosgestesclimat-scripts/cli')
const deepl = require('@incubateur-ademe/nosgestesclimat-scripts/deepl')
const utils = require('@incubateur-ademe/nosgestesclimat-scripts/utils')

const { regionModelsPath, supportedRegionCodes } = require('./regionCommons')

const { srcLang, destLangs, destRegions } = cli.getArgs(
  `Translates localized region models stored in ${regionModelsPath}.`,
  {
    source: true,
    target: true,
    model: { supportedRegionCodes }
  }
)

// TODO: support multiple models
const model = destRegions[0]

const srcFile = path.join(regionModelsPath, `${model}-${srcLang}.publicodes`)
const srcModel = utils.readYAML(srcFile)

const translateRule = async ([ruleName, ruleVal], destLang) => {
  const translate = (str) => {
    return deepl.fetchTranslation(
      str,
      srcLang.toUpperCase(),
      destLang.toUpperCase()
    )
  }
  const translateMd = (str) => {
    return deepl.fetchTranslationMarkdown(
      str,
      srcLang.toUpperCase(),
      destLang.toUpperCase()
    )
  }
  const translateMosaique = async (val) => {
    if (val === null || typeof val !== 'object') {
      return val
    }

    return Object.fromEntries(
      await Promise.all(
        Object.entries(val).map(async ([mosaiqueAttr, mosaiqueVal]) => {
          if (
            mosaiqueAttr === 'option aucun' &&
            typeof mosaiqueVal === 'string'
          ) {
            return [mosaiqueAttr, await translate(mosaiqueVal)]
          }
          return [mosaiqueAttr, mosaiqueVal]
        })
      )
    )
  }
  const translateAttr = async (attr, val) => {
    switch (attr) {
      case 'question':
      case 'description': {
        // Keep empty question values as-is instead of sending them to translation.
        if (val === '' || val === null) {
          break
        }
        val = translate(val)
        break
      }
      case 'suggestions': {
        val = Object.fromEntries(
          await Promise.all(
            Object.entries(val).map(async ([key, val]) => {
              const translatedKey = await translate(key)
              return [translatedKey, val]
            })
          )
        )
        break
      }
      case 'mosaique': {
        val = translateMosaique(val)
        break
      }
      case 'description':
      case 'note':
      case 'avertissement': {
        val = translateMd(val)
        break
      }
      default: {
        val = translate(val)
      }
    }
    return [attr, await val]
  }
  return [
    ruleName,
    Object.fromEntries(
      await Promise.all(
        Object.entries(ruleVal).map(async ([attr, val]) => {
          if (utils.mechanismsToTranslate.includes(attr)) {
            return translateAttr(attr, val)
          }
          return [attr, val]
        })
      )
    )
  ]
}

const translateModel = async (srcRules, destLang) => {
  return Object.fromEntries(
    await Promise.all(
      Object.entries(srcRules).map(async (rule) => {
        return await translateRule(rule, destLang)
      })
    )
  )
}

destLangs.forEach(async (destLang) => {
  const destFile = path.join(
    regionModelsPath,
    `${model}-${destLang}.publicodes`
  )
  console.log(
    'Translating',
    path.basename(srcFile),
    'to',
    path.basename(destFile)
  )
  if (existsSync(destFile)) {
    cli.printWarn(`File ${destFile} already exists.`)
    const overwrite = prompt('Overwrite? [y/N] ')
    if (overwrite !== 'y') {
      cli.printWarn('Skipping...')
      return
    }
  }
  const translatedModel = await translateModel(srcModel, destLang)
  utils.writeYAML(destFile, translatedModel, { sortMapEntries: false })
})
