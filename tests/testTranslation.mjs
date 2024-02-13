import { getArgs, getLocalRules, getLocalPersonas } from './commons.mjs'
import c from 'ansi-colors'
import { disabledLogger } from '@publicodes/tools'
import Engine from 'publicodes'

const { country, markdown } = getArgs()

const localEnRules = getLocalRules(country, 'en')
const localFrRules = getLocalRules(country, 'fr')

const localPersonas = getLocalPersonas(country, 'fr')

Promise.all([localFrRules, localPersonas, localEnRules]).then((res) => {
  const engineFr = new Engine(res[0], { logger: disabledLogger })
  const engineEn = new Engine(res[2], { logger: disabledLogger })

  const nbRules = Object.keys(res[0]).length
  const errors = []

  for (const rule in res[0]) {
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

  if (markdown) {
    console.log(`| Règle | fr | en |`)
    console.log(`| :-- | :-- | :-- |`)
    for (const error of errors) {
      console.log(`| ${error.rule} | ${error.fr} | ${error.en} |`)
    }
  } else {
    console.log('[ Test model translation (fr/en)]\n')

    for (const error of errors) {
      console.log(`${c.magenta(error.rule)}: ${error.fr} !== ${error.en}`)
    }

    console.log(
      `\n${errors.length > 0 ? c.red('FAIL') : c.green('OK')} ${nbRules - errors.length}/${nbRules}`
    )
  }
})
