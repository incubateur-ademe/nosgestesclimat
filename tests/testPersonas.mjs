import c from 'ansi-colors'
import Engine from 'publicodes'
import { disabledLogger } from '@publicodes/tools'

import {
  getArgs,
  getLocalRules,
  getLocalPersonas,
  getRulesFromDist,
  getPersonasFromDist,
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

const prodRules = await getRulesFromDist(version, country, language)
let prodPersonas = await getPersonasFromDist(version, country, language)

if (persona && persona in localPersonas && persona in prodPersonas) {
  localPersonas = { [persona]: localPersonas[persona] }
  prodPersonas = { [persona]: prodPersonas[persona] }
}

const localEngine = new Engine(localRules, {
  logger: disabledLogger,
  strict: { situation: false }
})
const prodEngine = new Engine(prodRules, {
  logger: disabledLogger,
  strict: { situation: false }
})

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
    localEngine.setSituation(localSituation || {})
    const safeSituation = localEngine.getSituation()

    const wrongLocalKeys = Object.keys(localSituation).filter(
      (key) => !(key in safeSituation)
    )

    if (wrongLocalKeys.length > 0) {
      if (version === 'nightly') {
        console.log(
          `Les règles suivantes n'existent pas dans le modèle ou leur valeur est impossible (_**${version}**_):`
        )
        wrongLocalKeys.forEach((key) => console.log(`- ${key}`))
      } else {
        console.warn(
          `${c.yellow('(warning:safeGetSituation)')} following rules doesn't exist in the model (${c.green(version)}) : ${c.magenta(wrongLocalKeys)}`
        )
      }
    }

    prodEngine.setSituation(prodSituation || {})
    const safeProdSituation = prodEngine.getSituation()

    const wrongProdKeys = Object.keys(prodSituation).filter(
      (key) => !(key in safeProdSituation)
    )

    if (wrongProdKeys.length > 0) {
      if (version === 'latest') {
        console.log(
          `Les règles suivantes n'existent pas dans le modèle ou leur valeur est impossible (_**${version}**_):`
        )
        wrongProdKeys.forEach((key) => console.log(`- ${key}`))
      } else {
        console.warn(
          `${c.yellow('(warning:safeGetSituation)')} following rules doesn't exist in the model (${c.green(version)}) : ${c.magenta(wrongProdKeys)}`
        )
      }
    }
  } catch (e) {
    printResults({ results: [{ type: 'error', message: e.message }], markdown })
    continue
  }

  for (const rule in localRules) {
    if (!(rule in prodRules)) {
      continue
    }
    let local
    try {
      local = localEngine.evaluate(rule)
    } catch (e) {
      console.error({ type: 'error', rule, message: e.message })
      continue
    }
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
