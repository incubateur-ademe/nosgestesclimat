import NGCRules from '../../public/co2-model.FR-lang.fr.json' assert { type: 'json' }
import path from 'path'
import Engine from 'publicodes'
import utils from '@incubateur-ademe/nosgestesclimat-scripts/utils'

export default function convertTo2Tonnes(personaSituation) {
  const conversionRulesFile = path.join(
    process.cwd(),
    'scripts/convertSituation/2Tonnes/conversion.publicodes'
  )
  const conversionRules = utils.readYAML(conversionRulesFile)

  const rules = { ...NGCRules, ...conversionRules }
  const engine = new Engine(rules)

  engine.setSituation(personaSituation)

  const NGCSituationAs2T = {}

  Object.keys(conversionRules).map((key) => {
    if (key.startsWith('utils')) {
      return
    }

    const { nodeValue } = engine.evaluate(key)

    const formattedKey = key.replace(/-/g, '_')

    switch (nodeValue) {
      case true:
        NGCSituationAs2T[formattedKey] = 'YES'
        break
      case false: {
        if (conversionRules[formattedKey] === 'non') {
          NGCSituationAs2T[formattedKey] = false
        } else {
          NGCSituationAs2T[formattedKey] = 'NO'
        }
        break
      }
      case undefined:
        NGCSituationAs2T[formattedKey] = 'default'
        break
      case null:
        NGCSituationAs2T[formattedKey] = 'default'
        break
      default:
        NGCSituationAs2T[formattedKey] = nodeValue
    }
  })

  return NGCSituationAs2T
}
