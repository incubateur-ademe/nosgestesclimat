/**
 * This script is only used to generate the model.json file packaged in the npm package.
 *
 * For complete compilation, see the ./scripts/rulesToJSON.mjs script
 *
 * TODO: this script should be abstracted into a standalone bin in @publicodes/tools
 */
import { writeFileSync } from 'fs'
import { getModelFromSource } from '@publicodes/tools/compilation'
const destPath = 'public/co2-model.FR-lang.fr-opti.json'

const model = getModelFromSource('data', {
  ignore: ['data/i18n/**'],
  verbose: true
})

writeFileSync(
  'index.js',
  `
import rules from "./${destPath}" assert { type: "json" };

export default rules;
`
)
console.log(`✅ index.js generated`)

let indexDTypes = Object.keys(model).reduce(
  (acc, dottedName) => acc + `| "${dottedName}"\n`,
  `
import { Rule } from "publicodes";

export type DottedName = 
`
)

indexDTypes += `
declare let rules: Record<DottedName, Rule>

export default rules;
`

writeFileSync('index.d.ts', indexDTypes)
console.log(`✅ index.d.ts generated`)
