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
import { getModelFromSource } from '@incubateur-ademe/publicodes-tools/compilation'

import { addTranslationToBaseRules } from './i18n/addTranslationToBaseRules.js'

import {
  supportedRegionPath,
  supportedRegions,
  supportedRegionCodes
} from './i18n/regionCommons.js'
import rulesToJSONWorker from './rulesToJSON.worker.mjs'

const t9nDir = 'data/i18n/t9n'

const { srcLang, srcFile, destLangs, destRegions, markdown } = cli.getArgs(
  `Aggregates the model to an unique JSON file.`,
  {
    source: true,
    target: true,
    model: { supportedRegionCodes },
    file: true,
    defaultSrcFile: 'data',
    markdown: true
  }
)

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
  new Engine(baseRules, {
    logger: {
      log: (_) => {},
      warn: (message) => {
        if (!markdown) {
          console.warn(message)
        }
      },
      err: (_) => {}
    }
  }).evaluate('bilan')

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

console.debug('Running in multi-thread mode:', multiThread)

const piscina = multiThread
  ? new Piscina({
      filename: new URL('./rulesToJSON.worker.mjs', import.meta.url).href
    })
  : null

try {
  destLangs.unshift(srcLang)
  const resultOfCompilationAndOptim = await Promise.all(
    destLangs.flatMap((destLang) => {
      const translatedBaseRules = getTranslatedRules(baseRules, destLang)
      return destRegions.map((regionCode) => {
        try {
          return multiThread
            ? piscina.run({
                regionCode,
                destLang,
                translatedBaseRules,
                markdown
              })
            : rulesToJSONWorker({
                regionCode,
                destLang,
                translatedBaseRules,
                markdown
              })
        } catch (err) {
          console.log(`Error in worker ${regionCode}-${destLang}`, err)
          piscina.threads.forEach((thread) => thread.terminate())
        }
      })
    })
  )

  if (markdown) {
    console.log(
      `| Successfully compiled and optimized rules: <br><details><summary>Expand</summary> <ul>${resultOfCompilationAndOptim
        .map(({ ok }) => ok ?? '')
        .join(' ')}</ul></details> | :heavy_check_mark: | Ø |`
    )
  }
  const errors = resultOfCompilationAndOptim
    .map(({ err }) => err)
    .filter(Boolean)
  if (errors.length > 0) {
    errors.forEach((err) => console.error(err))
    exit(-1)
  }
} catch (err) {
  piscina.threads.forEach((thread) => thread.terminate())
}
