/**
 *
 * TODO: this script should be abstracted into a standalone bin in @publicodes/tools
 */
import fs from 'fs'
import path from 'path'

const everyModelFolder = 'public'
const originModelFile = 'co2-model.FR-lang.fr.json'

const destPath = 'nosgestesclimat.model.json'

console.log('➡️ Preparing package ...')

const everyModelPath = path.join(process.cwd(), everyModelFolder)

// Copying the origin model file to the root of the package (for use in others publicodes projects)
fs.copyFileSync(
  path.join(process.cwd(), `${everyModelFolder}/${originModelFile}`),
  destPath
)

// Generating main index file (it only export types)
fs.writeFileSync('index.js', `export * from './index.d.ts';`)

// Generate the DottedName type
fs.writeFileSync('./dottedNames.d.ts', generateTypes(destPath))

console.log(`✅ dottedNames types generated`)
console.log('➡️ Packaging done')

function generateTypes(destPath) {
  const rawData = fs.readFileSync(destPath)
  const model = JSON.parse(rawData)

  const dFile = `
export type DottedName =
${Object.keys(model)
  .map((dottedName) => `  | "${dottedName}"`)
  .join('\n')}`

  return dFile
}
