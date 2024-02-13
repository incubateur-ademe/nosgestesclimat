import { disabledLogger } from '@publicodes/tools'
import {
  defaultLang,
  availableLanguages
} from '@incubateur-ademe/nosgestesclimat-scripts/utils'
import Engine from 'publicodes'
import Engine77 from 'publicodes-beta-77'
import c from 'ansi-colors'
import yargs from 'yargs'
import { readFile } from 'fs/promises'

const API_URL = 'https://nosgestesclimat-api.osc-fr1.scalingo.io'

export function getArgs() {
  return yargs(process.argv.slice(2))
    .version(false)
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
    .option('version', {
      alias: 'v',
      type: 'string',
      description: 'The version of the model to test agains',
      default: 'nightly'
    })
    .option('persona', {
      alias: 'p',
      type: 'string',
      description: 'Test only one persona'
    })
    .help('h')
    .alias('h', 'help').argv
}

export function getLocalRules(region, lang, optim = false) {
  return readFile(
    `./public/co2-model.${region}-lang.${lang}${optim ? '-opti' : ''}.json`,
    {
      encoding: 'utf8'
    }
  )
    .then((res) => JSON.parse(res))
    .catch((e) => {
      console.error(`No local rules found for ${region} and ${lang}`)
      console.error(e.message)
      process.exit(1)
    })
}

export function getLocalPersonas(region, lang) {
  return readFile(`./public/personas-${lang}.json`, {
    encoding: 'utf8'
  })
    .then((res) => JSON.parse(res))
    .catch((e) => {
      console.error(`No local personas found for ${region} and ${lang}:`)
      console.error(e.message)
      process.exit(1)
    })
}

export function getRulesFromAPI(version, region, lang) {
  return fetch(`${API_URL}/${version}/${lang}/${region}/rules`)
    .then((res) => res.json())
    .catch((e) => {
      console.error(
        `No prod rules found for ${region} and ${lang} (${version}):`
      )
      console.error(e.message)
      process.exit(1)
    })
}

export function getPersonasFromAPI(version, region, lang) {
  return fetch(`${API_URL}/${version}/${lang}/personas`)
    .then((res) => res.json())
    .catch((e) => {
      console.error(
        `No prod personas found for ${region} and ${lang} (${version}):`
      )
      console.error(e.message)
      process.exit(1)
    })
}

export function testPersonas(
  rules,
  personas,
  markdown,
  rulesToTest = ['bilan'],
  beta77 = false
) {
  console.log(`Testing personas (engine: ${beta77 ? 'beta77' : 'v1'})`)
  console.log(`(It may take a while)`)
  const engine = beta77
    ? new Engine77(rules, { logger: disabledLogger })
    : new Engine(rules, {
        logger: disabledLogger,
        allowOrphanRules: true
      })
  const personasRules = Object.values(personas)
  const results = {}

  for (const persona of personasRules) {
    let personaData = persona.situation || {}
    for (const ruleName in personaData) {
      if (!(ruleName in rules)) {
        if (!markdown) {
          console.log(`Rule '${ruleName}' not found in the model`)
        }
        delete personaData[ruleName]
      }
    }
    engine.setSituation(personaData)
    results[persona.nom] = {}
    for (const rule of rulesToTest) {
      results[persona.nom][rule] = engine.evaluate(rule).nodeValue
    }
  }

  return results
}

export function printResults({ markdownHeader, results, nbTests, markdown }) {
  if (results.length === 1 && results[0].type === 'error') {
    // An error occured while trying to set the situation
    if (markdown) {
      console.log(`
An error occured while testing the model:
${results[0].message}
`)
    } else {
      console.log(`${c.red('(err)')} An error occured while testing the model:`)
      console.log(`${results[0].message}\n`)
    }
    process.exit(1)
  }

  if (markdown) {
    console.log(markdownHeader)
    console.log('|:-----|:------|:------|:------:|:-----|')
  }

  const fails = []

  for (const result of results) {
    if (result.type === 'warning') {
      if (!markdown) {
        console.log(
          `${c.yellow('(warn)')} ${c.magenta(result.rule)}: ${result.msg}`
        )
      } else {
        // NOTE: for now we don't need to print the warning in the markdown
        // console.log(
        //   `| ${c.magenta(result.rule)} | | | | (warning) ${result.msg} |`
        // )
      }

      continue
    }
    const actualRounded = Math.fround(result.actual)
    const expectedRounded = Math.fround(result.expected)
    const diff =
      actualRounded && expectedRounded ? actualRounded - expectedRounded : 0

    if (diff !== 0) {
      const diffPercent = Math.abs(Math.round((diff / expectedRounded) * 100))

      if (markdown) {
        console.log(
          fmtGHActionErr(
            actualRounded,
            expectedRounded,
            diff,
            diffPercent,
            result.rule,
            result.message
          )
        )
      } else {
        fails.push(
          fmtCLIErr(
            actualRounded,
            expectedRounded,
            diff,
            diffPercent,
            result.rule,
            result.message
          )
        )
      }
    }
  }

  if (!markdown) {
    const nbFails = fails.length
    fails.forEach((fail) => console.log(fail))
    console.log(`\n${c.green('OK')} ${nbTests - nbFails}/${nbTests}`)
    if (nbFails > 0) {
      console.log(`${c.red('FAIL')} ${nbFails}/${nbTests}`)
    }
  }
}

function formatValueInKgCO2e(value) {
  return Math.fround(value).toLocaleString('en-us')
}

function fmtCLIErr(actual, expected, diff, diffPercent, rule, message) {
  const color = diffPercent <= 1 ? c.yellow : c.red
  const sign = diff > 0 ? '+' : diff < 0 ? '-' : ''
  const hd = color(diffPercent <= 1 ? '(warn)' : '(err)')
  return `${color(hd)} ${c.magenta(rule)}:${message ? `\n${message}` : ''} ${formatValueInKgCO2e(actual)} ${c.dim.italic('actual')} != ${formatValueInKgCO2e(expected)} ${c.dim.italic('expected')} (${color(sign + diffPercent)}%)`
}

function fmtGHActionErr(expected, actual, diff, diffPercent, name, message) {
  // const color =
  //   diffPercent <= 1 ? 'sucess' : diffPercent > 5 ? 'critical' : 'important'
  // const sign = diff > 0 ? '%2B' : '-'
  return `| ${name} | ${actual.toLocaleString('en-us')} | ${expected.toLocaleString('en-us')} | ${
    diff > 0 ? '+' : '-'
  }${diffPercent}% | ${message ?? ''} |`
}
