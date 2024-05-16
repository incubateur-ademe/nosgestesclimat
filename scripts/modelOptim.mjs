// Description: contains wrappers around the constant folding optimization pass from
// 				[@publicodes/tools] to be used in the build scripts: rulesToJSON.
//
// [@publicodes/tools]: https:github.com/incubateur-ademe/publicodes-tools

import { writeFileSync } from 'fs'
import { serializeParsedRules } from '@publicodes/tools'
import { constantFolding } from '@publicodes/tools/optims'

// Rule names which should be kept in the optimized model.
//
// We need to keep the rules below because they are used in the simulation
// (e.g. 'bilan' or 'actions' are used to compute the total CO2 emissions).
// We also need to keep rules which are used in the UI (e.g. 'pétrole . pleins'
// and 'pétrole . volume plein' are used to compute the total volume of fuel), and
// rules that contain the 'icônes' key.
// We also need to keep all notification rules, which are not used for compilation
// but important for thee UI.
//
// @Clément: Do we still need those rules ? 'logement . chauffage . gaz' ? 'logement . chauffage . biogaz' ?

// @Clément: `transport . voiture . électrique` and `transport . voiture . thermique` need to be kept as they are empty rules and their children are used for calculations.
const rulesToKeep = [
  'actions',
  'bilan',
  'logement . chauffage . gaz',
  'logement . chauffage . biogaz',
  'transport . voiture . thermique',
  'transport . voiture . électrique',
  'transport . ferry . surface',
  'logement . chauffage . gaz . consommation estimée via le coût',
  'logement . chauffage . bouteille gaz . consommation estimée via le poids',
  'logement . chauffage . citerne propane . consommation estimée via le coût',
  'logement . chauffage . fioul . consommation estimée via le coût',
  'logement . chauffage . bois . type . granulés . consommation estimée via le coût',
  'logement . chauffage . bois . type . bûches . consommation estimée via le coût',
  'logement . chauffage . réseau de chaleur . consommation estimée via le coût',
  'logement . électricité . consommation estimée via le coût',
  'ui . pédagogie . empreinte faible'
]

// Rule names which should be avoided in the optimized model.
// We don't want to have to replace the rule refs in the sum of the rules
// by their value to be able to use them in the UI.
const rulesToAvoid = ['services sociétaux']

const attributesToRemove = ['optimized', 'note']

export function compressRules(engine, jsonPathWithoutExtension) {
  const destPath = `${jsonPathWithoutExtension}-opti.json`
  const toKeep = (ruleNode) => {
    return (
      rulesToKeep.includes(ruleNode.dottedName) ||
      'icônes' in ruleNode.rawNode ||
      ruleNode.rawNode.type === 'notification'
    )
  }
  const toAvoid = (ruleNode) => {
    return rulesToAvoid.includes(ruleNode.dottedName)
  }

  const foldedRules = serializeParsedRules(
    constantFolding(engine, { toKeep, toAvoid })
  )

  for (const ruleName in foldedRules) {
    const rule = foldedRules[ruleName]
    if (rule) {
      attributesToRemove.forEach((attribute) => {
        delete foldedRules[ruleName][attribute]
      })
    }
  }

  writeFileSync(destPath, JSON.stringify(foldedRules))

  return Object.keys(foldedRules).length
}
