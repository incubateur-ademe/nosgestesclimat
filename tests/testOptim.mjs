import { readFile } from 'fs/promises'
import yargs from 'yargs'
import {
  defaultLang,
  availableLanguages
} from '@incubateur-ademe/nosgestesclimat-scripts/utils'
import { testPersonas, printResults } from './commons.mjs'

const { country, language, markdown } = yargs(process.argv.slice(2))
  .usage('Compare local and prod personas results\n\nUsage: $0 [options]')
  .option('country', {
    alias: 'c',
    describe: 'Target country code',
    type: 'string',
    default: 'FR'
  })
  .option('language', {
    alias: 'l',
    describe: 'Target language code',
    type: 'string',
    default: defaultLang,
    choices: availableLanguages
  })
  .option('markdown', {
    alias: 'm',
    type: 'boolean',
    description: 'Prints the result in a Markdown table format.'
  })

  .help('h')
  .alias('h', 'help').argv

const baseRules = readFile(
  `./public/co2-model.${country}-lang.${language}.json`,
  {
    encoding: 'utf8'
  }
)
  .then((res) => JSON.parse(res))
  .catch((e) => {
    console.log(
      `No local rules found for ${country} and ${language}, using base rules:`
    )
    console.log(e.message)
    process.exit(-1)
  })

const optimRules = readFile(
  `./public/co2-model.${country}-lang.${language}-opti.json`,
  {
    encoding: 'utf8'
  }
)
  .then((res) => JSON.parse(res))
  .catch((e) => {
    console.log(
      `No local rules found for ${country} and ${language}, using base rules:`
    )
    console.log(e.message)
    process.exit(-1)
  })

const personas = readFile(`./public/personas-${language}.json`, {
  encoding: 'utf8'
})
  .then((res) => JSON.parse(res))
  .catch((e) => {
    console.log(
      `No local personas found for ${country} and ${language}, using personas:`
    )
    console.log(e.message)
    process.exit(-1)
  })

const allData = Promise.all([optimRules, personas, baseRules])

allData.then((res) => {
  const optimResults = testPersonas(res[0], res[1])
  const baseResults = testPersonas(res[2], res[1])
  printResults(optimResults, baseResults, markdown, true)
})
