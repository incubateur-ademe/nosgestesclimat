import Engine from 'publicodes'
import { disabledLogger } from '@publicodes/tools'
import {
  getLocalRules,
  getLocalInitialExtendedSituation
} from '../../tests/commons.mjs'

const localRules = await getLocalRules('FR', 'fr')

const engine = new Engine(localRules, {
  logger: disabledLogger,
  strict: { situation: false }
})

const rawMissingVariables = engine?.evaluate('bilan')?.missingVariables || {}

const initialExtendedSituation = await getLocalInitialExtendedSituation()

export const getPersonaExtendedSituation = (personaSituation) => {
  engine.setSituation(personaSituation, { keepPreviousSituation: false })

  return Object.keys(initialExtendedSituation).reduce((acc, key) => {
    // Si la clé est dans la situation du persona, il a répondu à la question
    if (personaSituation[key] !== undefined) {
      acc[key] = {
        nodeValue: engine.evaluate(key).nodeValue,
        source: 'answered'
      }
      return acc
    } else if (
      // Si la clé n'est pas dans la situation du persona, mais que la clé est applicable et qu'elle est dans les variables manquantes du bilan, le persona a répondu par défaut à la question
      engine.evaluate({ 'est applicable': key }).nodeValue !== undefined &&
      rawMissingVariables[key] !== undefined
    ) {
      acc[key] = {
        nodeValue:
          engine.evaluate(key).nodeValue === null ||
          engine.evaluate(key).nodeValue === undefined
            ? 'non défini'
            : engine.evaluate(key).nodeValue,
        source: 'default'
      }
      return acc
    } else {
      // Sinon, le persona n'a pas répondu à la question
      acc[key] = { source: 'omitted' }
      return acc
    }
  }, {})
}
