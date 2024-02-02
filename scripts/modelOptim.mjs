// Description: contains wrappers around the constant folding optimization pass from
// 				[@publicodes/tools] to be used in the build scripts: rulesToJSON.
//
// [@publicodes/tools]: https:github.com/incubateur-ademe/publicodes-tools

import Engine from 'publicodes'
import path from 'path'
import { readFileSync, writeFileSync } from 'fs'
import { disabledLogger, serializeParsedRules } from '@publicodes/tools'
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

}

/**
 * Applies a constant folding optimization pass to the parsed rules from the [model] path.
 *
 * @param modelPath Path to the folder containing the Publicodes files or to a JSON file (the extension must be '.json' then).
 * @param json Path to the JSON file target.
 * @param toKeep Predicate function to determine which rule should be kept.
 * @param verbose If true, the function will log the steps of the optimization pass.
 *
 * @returns An error message if the optimization pass failed, undefined otherwise.
 */
export function constantFoldingFromJSONFile(
  modelPath,
  jsonDestPath,
  toKeep,
  verbose = false
) {
  const log = verbose ? console.log : function (_) {}
  try {
    log('Parsing rules from the JSON file:', modelPath)
    const rules = JSON.parse(readFileSync(modelPath, 'utf8'))
    const engine = new Engine(rules, { logger: disabledLogger })

    log('Constant folding pass...')
    const foldedRules = serializeParsedRules(constantFolding(engine, toKeep))

    log(`Writing in '${jsonDestPath}'...`)
    writeFileSync(jsonDestPath, JSON.stringify(foldedRules, null, 2))
    return { nbRules: Object.keys(foldedRules).length }
  } catch (error) {
    return { err }
  }
  writeFileSync(destPath, JSON.stringify(foldedRules))
  return Object.keys(foldedRules).length
}
