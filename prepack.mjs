/**
 *
 * TODO: this script should be abstracted into a standalone bin in @publicodes/tools
 */
import fs from 'fs'
import path from 'path'

const everyModelFolder = 'public'
const originModelFile = 'co2-model.FR-lang.fr.json'

const destPath = 'nosgestesclimat.model.json'

const everyModelPath = path.join(process.cwd(), everyModelFolder)
const everyModel = fs
  .readdirSync(everyModelPath)
  .filter((file) => file.startsWith('co2'))

// Copying the origin model file to the root of the package (for use in others publicodes projects)
fs.copyFileSync(
  path.join(process.cwd(), `${everyModelFolder}/${originModelFile}`),
  destPath
)

// We loop on everyModel files to import it in the main index file and then export it in an object with the region code as key
let everyModelImports = ''
everyModel.forEach((model) => {
  const splitName = model.split('-')

  const regionCode = splitName[1].split('.')[1]
  const locale = splitName[2].split('.')[1]
  const isOptim = splitName[3] ? true : false

  everyModelImports += `import ${regionCode}_${locale}${isOptim ? '_optim' : ''} from './public/${model}';\n`
})

console.log(`✅ every model imported`, everyModelImports)

let everyModelObjectExport = 'const models = {\n'
everyModel.forEach((model) => {
  const splitName = model.split('-')

  const regionCode = splitName[1].split('.')[1]
  const locale = splitName[2].split('.')[1]
  const isOptim = splitName[3] ? true : false

  everyModelObjectExport += `  '${model}': ${regionCode}_${locale}${isOptim ? '_optim' : ''},\n`
})
everyModelObjectExport += '}'

console.log(everyModelObjectExport)

// Generating main index and types
fs.writeFileSync(
  'index.js',
  generateIndex(`./${destPath}`) +
    `

${everyModelImports}

import supportedRegions from './public/supportedRegions.json' 

import personasFr from './public/personas-fr.json' 
import personasEn from './public/personas-en.json' 

import migration from './public/migration.json'

const personas = {
  fr: personasFr,
  en: personasEn,
  es: personasEs
}

${everyModelObjectExport}

export { supportedRegions, personas, migration, models }`
)

fs.writeFileSync(
  'index.d.ts',
  generateTypes(destPath) +
    `
export type Persona = {
  nom: string
  description: string
  icônes: string
  résumé?: string
  situation: Partial<Record<DottedName, string | number>>
}

export const models: Record<string, Rules>

export const personas: Record<string, Persona>

export type migrationType = {
  keysToMigrate: Record<DottedName, DottedName>
  valuesToMigrate: Record<DottedName, Record<string, NodeValue>>
}

export const migration: migrationType


export type RegionAuthor = {
  nom: string
  url?: string
}

export type RegionCode = string

export type RegionParams = {
  code: RegionCode
  nom: string
  gentilé: string
  authors?: RegionAuthor[]
  drapeau?: string
}

export type SupportedRegionType = {
  [currentLang: string]: RegionParams
}

export type SupportedRegions = { [key: string]: SupportedRegionType }

export const supportedRegions: SupportedRegions`
)
console.log(`✅ main index and types generated`)

function generateIndex(pathToModel) {
  return `import rules from "${pathToModel}";
      
export default rules;`
}

function generateTypes(destPath) {
  const rawData = fs.readFileSync(destPath)
  const model = JSON.parse(rawData)

  const dFile = `import { Rule } from "publicodes";
  
export type DottedName =
${Object.keys(model)
  .map((dottedName) => `  | "${dottedName}"`)
  .join('\n')}

declare let rules: Record<DottedName, Rule>
  
export default rules;`

  return dFile
}

// Generating index and types for each model
// everyModel.forEach((model) => {
//   const splitName = model.split('-')

//   const regionCode = splitName[1].split('.')[1]
//   const locale = splitName[2].split('.')[1]
//   const isOptim = splitName[3] ? true : false

//   const destPath = `versions/${regionCode}/${locale}${isOptim ? '/optim' : ''}`

//   fs.mkdirSync(destPath, { recursive: true })

//   fs.writeFileSync(
//     destPath + '/index.js',
//     generateIndex(
//       `../../../${isOptim ? '../' : ''}${everyModelFolder}/${model}`
//     )
//   )
//   fs.writeFileSync(
//     destPath + '/index.d.ts',
//     generateTypes(`${everyModelFolder}/${model}`)
//   )
//   console.log(`✅ index and types generated for ${regionCode} - ${locale}`)
// })
