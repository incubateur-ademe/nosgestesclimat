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

  const default2TFile = path.join(
    process.cwd(),
    'scripts/convertSituation/2Tonnes/default2T.yaml'
  )

  const default2T = utils.readYAML(default2TFile)

  const ifAbsent2TFile = path.join(
    process.cwd(),
    'scripts/convertSituation/2Tonnes/ifAbsent2T.yaml'
  )
  const ifAbsent2T = utils.readYAML(ifAbsent2TFile)

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
      case 'default':
        NGCSituationAs2T[formattedKey] = default2T[formattedKey]
        break
      case 'absent':
        NGCSituationAs2T[formattedKey] = ifAbsent2T[formattedKey]
        break
      case 'NO':
        NGCSituationAs2T[formattedKey] = 'NO'
        break
      case false:
        NGCSituationAs2T[formattedKey] = 'FALSE'
        break
      case 'YES':
        NGCSituationAs2T[formattedKey] = 'YES'
        break
      case true:
        NGCSituationAs2T[formattedKey] = 'TRUE'
        break
      case undefined:
      case null:
        NGCSituationAs2T[formattedKey] = ifAbsent2T[formattedKey]
        break
      default:
        NGCSituationAs2T[formattedKey] = nodeValue
    }
  })

  return NGCSituationAs2T
}
