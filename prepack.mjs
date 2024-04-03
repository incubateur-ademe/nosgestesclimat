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

// Generating index and types for each model
everyModel.forEach((model) => {
  const splitName = model.split('-')

  const regionCode = splitName[1].split('.')[1]
  const locale = splitName[2].split('.')[1]
  const isOptim = splitName[3] ? true : false

  const destPath = `versions/${regionCode}/${locale}${isOptim ? '/optim' : ''}`

  fs.mkdirSync(destPath, { recursive: true })

  fs.writeFileSync(
    destPath + '/index.js',
    generateIndex(
      `../../../${isOptim ? '../' : ''}${everyModelFolder}/${model}`
    )
  )
  fs.writeFileSync(
    destPath + '/index.d.ts',
    generateTypes(`${everyModelFolder}/${model}`)
  )
  console.log(`✅ index and types generated for ${regionCode} - ${locale}`)
})

// Generating main index and types
fs.writeFileSync(
  'index.js',
  generateIndex(`./${destPath}`) +
    `
import supportedRegions from './public/supportedRegions.json' assert { type: 'json' }

import personasFr from './public/personas-fr.json' assert { type: 'json' }
import personasEn from './public/personas-en.json' assert { type: 'json' }

import migration from './public/migration.json' assert { type: 'json' }

const personas = {
  fr: personasFr,
  en: personasEn
}

export { supportedRegions, personas, migration }`
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

export const personas: {
  fr: Record<string, Persona>
  en: Record<string, Persona>
}

export type migrationType = {
  keysToMigrate: Record<DottedName, DottedName>
  valuesToMigrate: Record<DottedName, Record<string, NodeValue>>
}

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

export type SuppportedRegions = { [key: string]: SupportedRegionType }

export const supportedRegions: SuppportedRegions`
)
console.log(`✅ main index and types generated`)

function generateIndex(pathToModel) {
  return `import rules from "${pathToModel}" assert { type: "json" };
      
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
