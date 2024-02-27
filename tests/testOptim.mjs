import { disabledLogger } from '@publicodes/tools'
import c from 'ansi-colors'
import Engine from 'publicodes'
import safeGetSituation from './helpers/safeGetSituation.mjs'

import {
  getArgs,
  getLocalRules,
  getLocalPersonas,
  printResults
} from './commons.mjs'

/**
 * Compares the value of all the rules between the base and the optimized rules
 * with the situation of the specified persona (default: all personas).
 *
 * TODO: factorize the code with testPersonas.mjs
 */

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
  const results = []

  if (markdown) {
    console.log(`<details>`)
    console.log(`<summary><code>${personaName}</code></summary>\n`)
  } else {
    console.log(
      `[ Test model optimisation for persona ${c.magenta(personaName)} ]\n`
    )
  }

  try {
    baseEngine.setSituation(
      safeGetSituation({
        situation: persona.situation || {},
        parsedRulesNames: Object.keys(baseEngine.getParsedRules()),
        version: 'base'
      })
    )
    optimEngine.setSituation(
      safeGetSituation({
        situation: persona.situation || {},
        parsedRulesNames: Object.keys(optimEngine.getParsedRules()),
        version: 'optim'
      })
    )
  } catch (e) {
    printResults({ results: [{ type: 'error', message: e.message }], markdown })
    continue
  }

  for (const rule in optimRules) {
    const actual = baseEngine.evaluate(rule)
    const expected = optimEngine.evaluate(rule)
    results.push({ type: 'result', rule, actual, expected })
  }

  printResults({
    markdownHeader: `| Règle | Base | Optim | Δ (%) | Message |`,
    results,
    nbTests: nbRules,
    markdown
  })
}
