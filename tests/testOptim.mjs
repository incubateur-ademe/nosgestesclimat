import { disabledLogger } from '@publicodes/tools'
import c from 'ansi-colors'
import Engine from 'publicodes'

import { getArgs, getLocalRules, getLocalPersonas } from './commons.mjs'

const { country, language, markdown, persona: personaOpt } = getArgs()

const baseRules = await getLocalRules(country, language)
let localPersonas = await getLocalPersonas(country, language)

if (personaOpt && personaOpt in localPersonas) {
  localPersonas = { [personaOpt]: localPersonas[personaOpt] }
}

const optimRules = await getLocalRules(country, language, true)

const baseEngine = new Engine(baseRules, { logger: disabledLogger })
const optimEngine = new Engine(optimRules, {
  logger: disabledLogger,
  allowOrphanRules: true
})

const nbRules = Object.keys(optimRules).length

for (const personaName in localPersonas) {
  const persona = localPersonas[personaName]
  const errors = []
  const warnings = []

  if (markdown) {
    console.log(`**${personaName}**`)
  } else {
    console.log(`[ Test model optimisation (${personaName}) ]`)
  }

  try {
    baseEngine.setSituation(persona.situation || {})
    optimEngine.setSituation(persona.situation || {})
  } catch (e) {
    if (markdown) {
      console.log(`\`\`\`${e.message}\`\`\`\n`)
    } else {
      console.log(`${c.red('ERR')}`)
      console.log(`${e.message}\n`)
    }
    continue
  }

  for (const rule in optimRules) {
    try {
      const base = baseEngine.evaluate(rule).nodeValue
      const optim = optimEngine.evaluate(rule).nodeValue

      if (base !== optim) {
        if (
          base !== null &&
          optim !== null &&
          base.toPrecision(14) === optim.toPrecision(14)
        ) {
          warnings.push({ rule, base, optim })
        } else {
          errors.push({ rule, base, optim })
        }
      }
    } catch (e) {
      errors.push({ rule, base: e.message, optim: null })
    }
  }

  if (markdown) {
    console.log(`| Règle | base | optim |`)
    console.log(`| :-- | :-- | :-- |`)
    for (const error of errors) {
      console.log(`| ${error.rule} | ${error.base} | ${error.optim} |`)
    }
  } else {
    for (const error of errors) {
      console.log(
        `${c.magenta(error.rule)}:\n${error.base} !== ${error.optim}\n`
      )
    }

    for (const warning of warnings) {
      console.log(
        `${c.yellow(warning.rule)}:\n${warning.base} !== ${warning.optim} (equal with 14 digit precision)\n`
      )
    }

    console.log(
      `${errors.length > 0 ? c.red('FAIL') : c.green('OK')} ${
        nbRules - errors.length
      }/${nbRules}\n`
    )
  }
}
