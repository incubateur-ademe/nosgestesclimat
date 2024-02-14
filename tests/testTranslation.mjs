import { getArgs, getLocalRules, getLocalPersonas } from './commons.mjs'
import c from 'ansi-colors'
import { disabledLogger } from '@publicodes/tools'
import Engine from 'publicodes'

const { country } = getArgs()

const localEnRules = await getLocalRules(country, 'en')
const localFrRules = await getLocalRules(country, 'fr')

const engineFr = new Engine(localFrRules, { logger: disabledLogger })
const engineEn = new Engine(localEnRules, { logger: disabledLogger })

const nbRules = Object.keys(localFrRules).length
const errors = []

for (const rule in localFrRules) {
  try {
    const fr = engineFr.evaluate(rule).nodeValue
    const en = engineEn.evaluate(rule).nodeValue
    if (fr !== en) {
      errors.push({ rule, fr, en })
    }
  } catch (e) {
    errors.push({ rule, fr: e.message, en: null })
  }
}
console.log('[ Test model translation (fr/en)]\n')

for (const error of errors) {
  console.log(`${c.magenta(error.rule)}: ${error.fr} !== ${error.en}`)
}

console.log(
  `\n${errors.length > 0 ? c.red('FAIL') : c.green('OK')} ${nbRules - errors.length}/${nbRules}`
)
