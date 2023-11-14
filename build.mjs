import { writeFileSync } from 'fs'
import { getModelFromSource } from '@incubateur-ademe/publicodes-tools/compilation'
import { disabledLogger } from '@incubateur-ademe/publicodes-tools'
import Engine from 'publicodes'

const destPath = 'nosgestesclimat.model.json'

const model = getModelFromSource('data', {
  ignore: ['data/i18n/**'],
  verbose: true
})

try {
  new Engine(model, { logger: disabledLogger })
} catch (e) {
  console.error(`❌ Model compilation failed:\n${e.message}\n`)
  process.exit(-1)
}

writeFileSync(destPath, JSON.stringify(model, null, 2))
console.log(`✅ ${destPath} generated`)

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
