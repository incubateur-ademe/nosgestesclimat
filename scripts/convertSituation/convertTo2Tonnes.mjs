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

  // We need to merge NGCRules and conversionRules to have all the rules in the same engine
  const rules = { ...NGCRules, ...conversionRules }
  const engine = new Engine(rules)

  // We set the persona situation in the engine but it could be any situation.
  engine.setSituation(personaSituation)

  const NGCSituationAs2T = {}

  Object.keys(conversionRules).map((key) => {
    // We need to ignore utils rules
    if (key.startsWith('utils')) {
      return
    }

    // We evaluate conversion rule
    const { nodeValue } = engine.evaluate(key)

    // Publicodes doesn't support bottom dash in variable names
    const formattedKey = key.replace(/-/g, '_')

    switch (nodeValue) {
      case 'default':
        NGCSituationAs2T[formattedKey] = default2T[formattedKey]
        break
      case 'absent':
        NGCSituationAs2T[formattedKey] = ifAbsent2T[formattedKey]
        break
      // Sometimes, 2T value is a a boolean, sometimes 'YES' or 'NO'.
      // We need to convert boolean values to 'TRUE' or 'FALSE'
      // Case for 'YES' and 'NO' is not necessary but it's more explicit
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
