/*
Aggregates the model to an unique JSON file for each targeted language.

Command: yarn compile:rules -- [options]
*/

import fs from 'fs'
import path from 'path'
import { exit } from 'process'
import Engine from 'publicodes'
import { Piscina } from 'piscina'
import c from 'ansi-colors'

import cli from '@incubateur-ademe/nosgestesclimat-scripts/cli'
import utils from '@incubateur-ademe/nosgestesclimat-scripts/utils'
import { getModelFromSource } from '@publicodes/tools/compilation'

import { addTranslationToBaseRules } from './i18n/addTranslationToBaseRules.js'

import {
  supportedRegionPath,
  supportedRegions,
  supportedRegionCodes
} from './i18n/regionCommons.js'

import rulesToJSONWorker from './rulesToJSON.worker.mjs'

const t9nDir = 'data/i18n/t9n'

const {
  srcLang,
  srcFile,
  destLangs,
  destRegions,
  markdown,
  noOptim,
  forceOptim
} = cli.getArgs(`Aggregates the model to an unique JSON file.`, {
  source: true,
  target: true,
  model: { supportedRegionCodes },
  file: true,
  defaultSrcFile: 'data',
  markdown: true,
  optimCanBeDisabled: true,
  optimCanBeForced: true
})

/// ---------------------- Helper functions ----------------------

function writeSupportedRegions() {
  try {
    fs.writeFileSync(supportedRegionPath, JSON.stringify(supportedRegions))
    console.log(
      markdown
        ? `| Supported regions | :heavy_check_mark: | Ø |`
        : `✅ The supported regions have been correctly written in: ${supportedRegionPath}`
    )
  } catch (err) {
    if (markdown) {
      console.log(
        `| Supported regions | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
      )
    } else {
      console.log(
        '❌ An error occured while writting rules in:',
        supportedRegionPath
      )
      console.log(err.message)
    }
    exit(-1)
  }
}

function getTranslatedRules(baseRules, destLang) {
  if (destLang === srcLang) {
    return baseRules
  }
  const translatedAttrs =
    utils.readYAML(path.join(t9nDir, `translated-rules-${destLang}.yaml`)) ?? {}

  return addTranslationToBaseRules(baseRules, translatedAttrs)
}

function logPublicodesError(err) {
  let lines = err.message.split('\n')
  for (let i = 0; i < 9; ++i) {
    if (lines[i]) {
      console.error('  ', lines[i])
    }
  }
  console.error('')
}

/// ---------------------- Main ----------------------

if (!markdown) {
  console.log('➡️ Compiling rules...')
}

if (markdown) {
  console.log('| Task | Status | Message |')
  console.log('|:-----|:------:|:--------|')
}

writeSupportedRegions()

let baseRules

try {
  baseRules = getModelFromSource(srcFile, {
    ignore: ['data/i18n/**'],
    verbose: !markdown
  })
} catch (err) {
  console.error(`❌ An error occured while trying to parse the base rules:\n`)
  console.error(err.message)
  exit(-1)
}

try {
  const engine = new Engine(baseRules, {
    logger: {
      log: (_) => {},
      warn: (message) => {
        if (!markdown) {
          console.warn(message)
        }
      },
      err: (_) => {}
    }
  })

  engine.evaluate('bilan')
  engine.evaluate('actions')

  if (!markdown) {
    console.log(
      `✅ ${c.yellow(
        Object.keys(baseRules).length
      )} base rules have been correctly parsed`
    )
  }
} catch (err) {
  console.error(`❌ An error occured while trying to parse the base rules:\n`)
  logPublicodesError(err)
  exit(-1)
}

const multiThread = destRegions.length > 1

if (!markdown) {
  console.log(
    'ℹ️ Multi-threading mode:',
    multiThread ? c.green('ON') : c.yellow('OFF')
  )
  console.log(
    `ℹ️ Optimization mode: ${noOptim ? c.yellow('OFF') : c.green('ON')}`
  )
}

const piscina = multiThread
  ? new Piscina({
      filename: new URL('./rulesToJSON.worker.mjs', import.meta.url).href
    })
  : null

const printErrorAndExit = (err, regionCode, destLang) => {
  console.error(
    `❌ ${c.red(regionCode + '-' + destLang)} error while compiling:`
  )
  console.error(err.message)
  exit(-1)
}

const opts = { markdown, optimDisabled: noOptim, forceOptim }

destLangs.unshift(srcLang)
const resultOfCompilationAndOptim = await Promise.all(
  destLangs.flatMap((destLang) => {
    const translatedBaseRules = getTranslatedRules(baseRules, destLang)
    return destRegions.map((regionCode) => {
      if (multiThread) {
        return piscina
          .run({
            regionCode,
            destLang,
            translatedBaseRules,
            opts
          })
          .catch((err) => printErrorAndExit(err, regionCode, destLang))
      }

      try {
        return rulesToJSONWorker({
          regionCode,
          destLang,
          translatedBaseRules,
          opts
        })
      } catch (err) {
        printErrorAndExit(err, regionCode, destLang)
      }
    })
  })
)

if (markdown) {
  console.log(
    `| Successfully compiled and optimized rules: <br><details><summary>Expand</summary> <ul>${resultOfCompilationAndOptim
      .map((ok) => ok)
      .join(' ')}</ul></details> | :heavy_check_mark: | Ø |`
  )
} else {
  console.log(`${c.green('✅ Successfully compiled and optimized rules')}`)
}
