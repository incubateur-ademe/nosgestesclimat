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
import safeGetSituation from './helpers/safeGetSituation.mjs'

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
  version === 'latest'
    ? new Engine77(prodRules, { logger: disabledLogger })
    : new Engine(prodRules, { logger: disabledLogger })

const nbRules = Object.keys(localRules).length

for (const personaName in localPersonas) {
  const { situation: localSituation } = localPersonas[personaName]
  const { situation: prodSituation } = prodPersonas[personaName]
  const results = []

  if (markdown) {
    console.log(`#### ${localPersonas[personaName].nom}\n`)
  } else {
    console.log(
      `[ Test persona ${c.magenta(personaName)} regression against ${c.green(version)} ]\n`
    )
  }

  try {
    const safeSituation = safeGetSituation({
      situation: localSituation || {},
      everyRules: Object.keys(localRules),
      markdown: version === 'nightly' ? markdown : false
    })
    const safeProdSituation = safeGetSituation({
      situation: prodSituation || {},
      everyRules: Object.keys(prodRules),
      markdown: version === 'latest' ? markdown : false
    })
    localEngine.setSituation(safeSituation)
    prodEngine.setSituation(safeProdSituation)
  } catch (e) {
    printResults({ results: [{ type: 'error', message: e.message }], markdown })
    continue
  }

  for (const rule in localRules) {
    if (!(rule in prodRules)) {
      continue
    }

    const local = localEngine.evaluate(rule)
    const prod = prodEngine.evaluate(rule)
    results.push({ type: 'result', rule, actual: local, expected: prod })
  }

  printResults({
    markdownHeader: `| Règle | PR | ${version} | Δ (%) |`,
    results,
    nbTests: nbRules,
    markdown
  })
}
