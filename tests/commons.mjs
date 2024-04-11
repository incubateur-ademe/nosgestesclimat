import {
  defaultLang,
  availableLanguages
} from '@incubateur-ademe/nosgestesclimat-scripts/utils'
import c from 'ansi-colors'
import yargs from 'yargs'
import { readFile } from 'fs/promises'
import { serializeUnit } from 'publicodes'

const PREPROD_PREVIEW_URL = 'https://preprod--ecolab-data.netlify.app/'

// Same as site-nextjs, shouldn't it be https://data.nosgestesclimat.fr/ ?
const LATEST_PREVIEW_URL = 'https://master--ecolab-data.netlify.app/'

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

export function getLocalMigrationTable() {
  return readFile(`./public/migration.json`, {
    encoding: 'utf8'
  })
    .then((res) => JSON.parse(res))
    .catch((e) => {
      console.error(`No migration file found:`)
      console.error(e.message)
      process.exit(1)
    })
}

export function getRulesFromDist(version, region, lang) {
  const url = version === 'nightly' ? PREPROD_PREVIEW_URL : LATEST_PREVIEW_URL
  const fileName = `co2-model.${region}-lang.${lang}.json`
  return fetch(url + fileName)
    .then((res) => res.json())
    .catch((e) => {
      console.error(
        `No prod rules found for ${region} and ${lang} (${version}):`
      )
      console.error(e.message)
      process.exit(1)
    })
}

export function getPersonasFromDist(version, region, lang) {
  const url = version === 'nightly' ? PREPROD_PREVIEW_URL : LATEST_PREVIEW_URL
  const fileName = `personas-${lang}.json`
  return fetch(url + fileName)
    .then((res) => res.json())
    .catch((e) => {
      console.error(
        `No prod personas found for ${region} and ${lang} (${version}):`
      )
      console.error(e.message)
      process.exit(1)
    })
}

export function printResults({ markdownHeader, results, nbTests, markdown }) {
  if (results.length === 1 && results[0].type === 'error') {
    // An error occured while trying to set the situation
    if (markdown) {
      console.log(`
An error occured while testing the model:

~~~${results[0].message}
~~~
`)
    } else {
      console.log(`${c.red('(err)')} An error occured while testing the model:`)
      console.log(`${results[0].message}\n`)
    }
    // TODO: remove this when the production use the latest version
    // process.exit(1)
    return
  }

  if (markdown) {
    console.log()
    console.log(markdownHeader)
    console.log('|:-----|:------|:------|:-------|')
  }

  const fails = []

  results.sort((a, b) => a.rule.localeCompare(b.rule))
  let nbDiff = 0

  for (const result of results) {
    // created json report is too large if "empreinte branche" displayed
    if (result.rule.startsWith('empreinte branche')) {
      continue
    }
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
    const actualRounded =
      result.actual.nodeValue == null
        ? result.actual.nodeValue
        : Math.fround(result.actual.nodeValue)
    const actualUnit = serializeUnit(result.actual.unit)
    const expectedRounded =
      result.expected.nodeValue == null
        ? result.expected.nodeValue
        : Math.fround(result.expected.nodeValue)
    const expectedUnit = serializeUnit(result.expected.unit)

    const diff =
      isFinite(actualRounded) && isFinite(expectedRounded)
        ? actualRounded - expectedRounded
        : 0

    if (diff !== 0) {
      nbDiff++
      const diffPercent = Math.abs(Math.round((diff / expectedRounded) * 100))

      if (markdown) {
        console.log(
          fmtGHActionErr(
            actualRounded,
            actualUnit,
            expectedRounded,
            expectedUnit,
            diff,
            diffPercent,
            result.rule
          )
        )
      } else {
        fails.push(
          fmtCLIErr(
            actualRounded,
            actualUnit,
            expectedRounded,
            expectedUnit,
            diff,
            diffPercent,
            result.rule,
            result.message
          )
        )
      }
    }
  }

  if (markdown) {
    if (nbDiff === 0) {
      console.log(`✅ _Aucune différence détectée sur **${nbTests}** tests_`)
    }
  }

  if (!markdown) {
    const nbFails = fails.length
    fails.forEach((fail) => console.log(fail))
    if (nbFails > 0) {
      console.log(`\n${c.red('DIFF')} ${nbFails}/${nbTests}`)
    } else {
      console.log(`\n${c.green('OK')} ${nbTests}/${nbTests}\n`)
    }
  }
}

function formatValue(value) {
  return value === null ? 'null' : Math.fround(value).toLocaleString('en-us')
}

function fmtCLIErr(
  actual,
  actualUnit,
  expected,
  expectedUnit,
  diff,
  diffPercent,
  rule,
  message
) {
  const color = diffPercent <= 1 ? c.yellow : c.red
  const sign = diff > 0 ? '+' : diff < 0 ? '-' : ''
  return `${c.magenta(rule)}: ${color('(' + c.bold(sign + diffPercent) + '%)')} ${message ? `\n${message}` : ''}\n  ${c.dim('actual: ') + formatValue(actual)} ${c.dim.italic(actualUnit ?? '')}\n  ${c.dim('expected: ') + formatValue(expected)} ${c.dim.italic(expectedUnit ?? '')}`
}

function fmtGHActionErr(
  actual,
  actualUnit,
  expected,
  expectedUnit,
  diff,
  diffPercent,
  name
) {
  // const color =
  //   diffPercent <= 1 ? 'sucess' : diffPercent > 5 ? 'critical' : 'important'
  // const sign = diff > 0 ? '%2B' : '-'
  return `| ${name} | ${formatValue(actual)} ${actualUnit ? `_${actualUnit}_` : ''} | ${formatValue(expected)} ${expectedUnit ? `_${expectedUnit}_` : ''} | **${
    diff > 0 ? '+' : '-'
  }${diffPercent}%** |`
}
