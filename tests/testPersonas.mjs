import c from 'ansi-colors'
import Engine from 'publicodes'
import Engine77 from 'publicodes-beta-77'
import { disabledLogger } from '@publicodes/tools'

import {
  getArgs,
  getLocalRules,
  getLocalPersonas,
  getRulesFromAPI,
  getPersonasFromAPI,
  printResults
} from './commons.mjs'

/**
 * Compares the value of all the rules between the local and the prod (or specified) version
 * with the situation of the specified persona (default: all personas).
 *
 * TODO: factorize the code with testOptim.mjs
 * TODO: add the possibility to test only a subset of the rules
 */

const { country, language, markdown, version, persona } = getArgs()

const localRules = await getLocalRules(country, language)
let localPersonas = await getLocalPersonas(country, language)

const prodRules = await getRulesFromAPI(version, country, language)
let prodPersonas = await getPersonasFromAPI(version, country, language)

if (persona && persona in localPersonas && persona in prodPersonas) {
  localPersonas = { [persona]: localPersonas[persona] }
  prodPersonas = { [persona]: prodPersonas[persona] }
}

const localEngine = new Engine(localRules, { logger: disabledLogger })
const prodEngine =
  // TODO: remove this when the production use the latest version
  // of publicodes.
  new Engine77(prodRules, { logger: disabledLogger })

const nbRules = Object.keys(localRules).length

for (const personaName in localPersonas) {
  const { situation: localSituation } = localPersonas[personaName]
  const { situation: prodSituation } = prodPersonas[personaName]
  const results = []

  if (markdown) {
    console.log(`<details>`)
    console.log(`<summary><code>${personaName}</code></summary>\n`)
  } else {
    console.log(
      `[ Test persona ${c.magenta(personaName)} regression against ${c.green(version)} ]\n`
    )
  }

  try {
    localEngine.setSituation(localSituation || {})
    prodEngine.setSituation(prodSituation || {})
  } catch (e) {
    printResults({ results: [{ type: 'error', message: e.message }], markdown })
    continue
  }

  for (const rule in localRules) {
    if (!(rule in prodRules)) {
      results.push({
        type: 'warning',
        rule,
        msg: `Rule not found in ${c.green(version)}`
      })
      continue
    }

    const local = localEngine.evaluate(rule).nodeValue
    const prod = prodEngine.evaluate(rule).nodeValue
    results.push({ type: 'result', rule, actual: local, expected: prod })
  }

  printResults({
    markdownHeader: `| Règle | PR | ${version} | Δ (%) | Message |`,
    results,
    nbTests: nbRules,
    markdown
  })
}
