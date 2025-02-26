import { bench, group, run } from 'mitata'
import Engine from 'publicodes'
import OldEngine from 'publicodes-old'
import type { NGCRules } from '../index'
import {
  getLocalPersonas,
  getLocalRules,
  getRulesFromDist
} from '../tests/commons.mjs'

const oldRules = await getRulesFromDist('nightly', 'FR', 'fr')
const newRules = await getLocalRules('FR', 'fr')
const optimRules = await getLocalRules('FR', 'fr', true)
const localPersonas = await getLocalPersonas('FR', 'fr')

const getRandomPersonaSituation = () => {
  delete localPersonas['personas . marie']
  const personas = Object.keys(localPersonas)
  const randomPersona = personas[Math.floor(Math.random() * personas.length)]
  return localPersonas[randomPersona].situation
}

const options = {
  logger: { warn: () => {}, error: () => {}, log: () => {} }
}

const oldEngine = new OldEngine(oldRules as unknown as NGCRules, options)
const engine = new Engine(newRules as unknown as NGCRules, options)

group('Parsing initial des règles', () => {
  bench('all rules with old engine', () => {
    new OldEngine(oldRules as unknown as NGCRules, options)
  })
  bench('all rules with new engine', () => {
    new Engine(newRules as unknown as NGCRules, options)
  })

  bench('optim rules with new engine', () => {
    new Engine(optimRules as unknown as NGCRules, {
      ...options,
      strict: { noOrphanRule: false }
    })
  })
})

group('Evaluation', () => {
  bench('bilan with old engine', () => {
    oldEngine.setSituation({})
    oldEngine.evaluate('bilan')
  })
  bench('bilan with new engine', () => {
    engine.setSituation({})
    engine.evaluate('bilan')
  })
})

group('setSituation', () => {
  const situation = getRandomPersonaSituation()
  bench('setSituation with old engine', () => {
    oldEngine.setSituation(situation)
  })
  bench('setSituation with new engine', () => {
    engine.setSituation(situation)
  })
})

await run()
