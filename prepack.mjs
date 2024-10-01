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
// Create a types folder at the root of the package
if (!fs.existsSync('types')) {
  fs.mkdirSync('types')
}
fs.writeFileSync('./types/dottedNames.d.ts', generateTypes(destPath))

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
// Generate types for the Categories and Subcategories dottedNames
const categories = [
  'transport',
  'alimentation',
  'logement',
  'divers',
  'services sociétaux'
]
function generateCategoriesTypes(destPath) {
  const rawData = fs.readFileSync(destPath)

  const dFile = `
export type Categories = ${categories.map((category) => `  | "${category}"`).join('\n')}
`

  return dFile
}

function generateSubcategoriesTypes(destPath) {
  const rawData = fs.readFileSync(destPath)
  const model = JSON.parse(rawData)

  const subcategories = categories.flatMap((category) =>
    Object.keys(model).filter(
      (dottedName) =>
        dottedName.startsWith(category + ' . ') &&
        dottedName.split(' . ').length === 2
    )
  )

  const dFile = `
export type Subcategories =
${subcategories.map((subcategory) => `  | "${subcategory}"`).join('\n')}
`

  return dFile
}

fs.writeFileSync('./types/categories.d.ts', generateCategoriesTypes(destPath))
fs.writeFileSync(
  './types/subcategories.d.ts',
  generateSubcategoriesTypes(destPath)
)
