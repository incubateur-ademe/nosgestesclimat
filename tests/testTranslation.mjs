import { getArgs, getLocalRules } from './commons.mjs'
import c from 'ansi-colors'
import { disabledLogger } from '@publicodes/tools'
import Engine from 'publicodes'

const { country } = getArgs()

const localEnRules = await getLocalRules(country, 'en')
const localEsRules = await getLocalRules(country, 'es')
const localFrRules = await getLocalRules(country, 'fr')

const engineFr = new Engine(localFrRules, { logger: disabledLogger })
const engineEn = new Engine(localEnRules, { logger: disabledLogger })
const engineEs = new Engine(localEsRules, { logger: disabledLogger })

const nbRules = Object.keys(localFrRules).length
const errors = { en: [], es: [] }

for (const rule in localFrRules) {
  try {
    const fr = engineFr.evaluate(rule).nodeValue
    const en = engineEn.evaluate(rule).nodeValue
    const es = engineEs.evaluate(rule).nodeValue
    if (fr !== en) {
      errors.en.push({ rule, fr, en })
    }
    if (fr !== es) {
      errors.es.push({ rule, fr, es })
    }
  } catch (e) {
    errors.en.push({ rule, fr: e.message, en: null })
    errors.es.push({ rule, fr: e.message, en: null })
  }
}
console.log('[ Test model translation (fr/en)]\n')

for (const error of errors.en) {
  console.log(`${c.magenta(error.rule)}: ${error.fr} !== ${error.en}`)
}

console.log(
  `\n${errors.en.length > 0 ? c.red('FAIL') : c.green('OK')} ${nbRules - errors.en.length}/${nbRules}`
)

console.log('[ Test model translation (fr/es)]\n')

for (const error of errors.es) {
  console.log(`${c.magenta(error.rule)}: ${error.fr} !== ${error.es}`)
}

console.log(
  `\n${errors.es.length > 0 ? c.red('FAIL') : c.green('OK')} ${nbRules - errors.es.length}/${nbRules}`
)
