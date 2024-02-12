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
const rulesToKeep = [
  'actions',
  'bilan',
  'logement . chauffage . gaz',
  'logement . chauffage . biogaz',
  'transport . voiture . thermique',
  'transport . ferry . surface'
]

export function compressRules(engine, jsonPathWithoutExtension) {
  const destPath = `${jsonPathWithoutExtension}-opti.json`
  const toKeep = ([ruleName, ruleNode]) => {
    return (
      rulesToKeep.includes(ruleName) ||
      'icônes' in ruleNode.rawNode ||
      ruleNode.rawNode.type === 'notification'
    )
  }
  const foldedRules = serializeParsedRules(constantFolding(engine, toKeep))
  writeFileSync(destPath, JSON.stringify(foldedRules))
  return Object.keys(foldedRules).length
}
