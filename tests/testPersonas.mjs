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

const { country, language, markdown, version, persona, metric } = getArgs()

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
  const localSituation = {
    ...localPersonas[personaName].situation,
    métrique: `'${metric}'`
  }
  const prodSituation = {
    ...prodPersonas[personaName].situation,
    métrique: `'${metric}'`
  }
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
      (key) => !(key in safeSituation) && key !== 'métrique'
    )

    if (wrongLocalKeys.length > 0) {
      if (version === 'nightly' && markdown) {
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
      (key) => !(key in safeProdSituation) && key !== 'métrique'
    )

    if (wrongProdKeys.length > 0) {
      if (version === 'latest' && markdown) {
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

  // `page de fin` is the decomposition displayed on the end page: it must sum
  // up to `bilan`, otherwise the user sees two different footprints. The
  // comparison is rounded to the kg: the two sums do not add up their terms in
  // the same order, so the last digits of the floats differ.
  const bilan = localEngine.evaluate('bilan')
  const pageDeFin = localEngine.evaluate('page de fin')
  const roundedBilan = Math.round(bilan.nodeValue * 100) / 100
  const roundedPageDeFin = Math.round(pageDeFin.nodeValue * 100) / 100
  if (roundedBilan !== roundedPageDeFin) {
    const message = `bilan (${roundedBilan} kg) ≠ page de fin (${roundedPageDeFin} kg)`
    if (markdown) {
      console.log(`\n**⚠️ ${message}**\n`)
    } else {
      console.warn(`${c.yellow('(warning:page de fin)')} ${message}`)
    }
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
