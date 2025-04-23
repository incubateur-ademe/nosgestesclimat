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

// Copying the origin model file to the root of the package (for use in others publicodes projects)
fs.copyFileSync(
  path.join(process.cwd(), `${everyModelFolder}/${originModelFile}`),
  destPath
)

const rawData = fs.readFileSync(destPath)
const model = JSON.parse(rawData)

// Generating main index file (it only export types)
fs.writeFileSync('index.js', `export * from './index.d.ts';`)

if (!fs.existsSync('types')) {
  fs.mkdirSync('types')
}

// Generate the DottedName type
fs.writeFileSync('./types/dottedNames.d.ts', generateDottedNamesType(model))

// Generate the Categories type
fs.writeFileSync('./types/categories.d.ts', generateCategoriesTypes(model))

// Generate the Subcategories type
fs.writeFileSync(
  './types/subcategories.d.ts',
  generateSubcategoriesTypes(model)
)

console.log(`✅ dottedNames, categories and subcategories types generated`)
console.log('➡️ Packaging done')

function generateDottedNamesType(model) {
  const dFile = `
export type DottedName =
${Object.keys(model)
  .map((dottedName) => {
    if (model[dottedName] && Object.keys(model[dottedName]).includes('avec')) {
      return Object.keys(model[dottedName].avec)
        .map((subDottedName) => {
          return `  | "${dottedName} . ${subDottedName}"`
        })
        .join('\n')
    } else {
      return `  | "${dottedName}"`
    }
  })
  .join('\n')}`
  return dFile
}

function generateCategoriesTypes(model) {
  const categories = model['bilan']?.formule.somme
  const dFile = `
export type Categories = ${categories.map((category) => `  | "${category}"`).join('\n')}
`

  return dFile
}

function generateSubcategoriesTypes(model) {
  const subcategories = Object.keys(model).filter((dottedName) =>
    dottedName.startsWith('ui . pédagogie . sous catégories . ')
  )
  const dFile = `
  export type Subcategories =
  ${subcategories.map((subcategory) => `  | "${subcategory}"`).join('\n')}
  `
  return dFile
}
