/**
 *
 * TODO: this script should be abstracted into a standalone bin in @publicodes/tools
 */
import fs from 'fs'
import path from 'path'
import Engine from 'publicodes'
import generateExtendedSituationDottedNames from './scripts/situation/generateExtendedSituationDottedNames.mjs'

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

// Generate the ExtendedSituationDottedNames type
fs.writeFileSync(
  './types/extendedSituationDottedNames.d.ts',
  generateExtendedSituationDottedNamesTypes(model)
)

// Generate the Questions type
fs.writeFileSync('./types/questions.d.ts', generateQuestionsType(model))

// Generate the Categories type
fs.writeFileSync('./types/categories.d.ts', generateCategoriesTypes(model))

// Generate the Subcategories type
fs.writeFileSync(
  './types/subcategories.d.ts',
  generateSubcategoriesTypes(model)
)

console.log(
  `✅ dottedNames, extendedSituationDottedNames, questions, categories and subcategories types generated`
)

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
        .concat([`  | "${dottedName}"`])
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

function generateExtendedSituationDottedNamesTypes(model) {
  const questionDottedName = generateExtendedSituationDottedNames(model)
  const dFile = `
export type ExtendedSituationDottedNames =
${questionDottedName.map((dottedName) => `  | "${dottedName}"`).join('\n')}
`
  return dFile
}

// Question generation si a feature from @publicodes/tools compilation that we do not use for now. We should migrate to it when Publicodes 2.0 will be released.
function generateQuestionsType(model) {
  const engine = new Engine(model)
  const ruleTypes = resolveRuleTypes(engine)
  // exception for the "métrique" rule which must be ine the question situation schema even if it is not a question rule.
  const serializedQuestionsRuleTypes = Object.entries(ruleTypes)
    .filter(
      ([name]) => engine.getRule(name).rawNode.question || name === 'métrique'
    )
    .map(([name, type]) => `  "${name}": ${serializeType(type)}`)
    .join(',\n')

  return `
/**
 * String representing a date in the format 'DD/MM/YYYY' or 'MM/YYYY'.
 */
export type PDate = string

/**
 * Publicodes boolean type.
 */
export type PBoolean = 'oui' | 'non'

/**
 * String constants are enclosed in single quotes to differentiate them from references.
 */
export type PString = \`'\${string}'\`

/**
 * Subset of the publicodes situation with only question rules.
 *
 * This represents raw publicodes inputs for question rules.
 */
export type Questions = Partial<{
${serializedQuestionsRuleTypes}
}>
`
}

function resolveRuleTypes(engine) {
  const parsedRules = engine.getParsedRules()
  const ruleTypes = {}

  for (const ruleName in parsedRules) {
    const rule = parsedRules[ruleName]
    const ruleType = engine.context.nodesTypes.get(rule)
    const possibilities = engine.getPossibilitiesFor(ruleName)

    if (possibilities) {
      ruleTypes[ruleName] = {
        type: 'enum',
        options: possibilities.map(({ nodeValue }) => nodeValue.toString()),
        isNullable: ruleType?.isNullable
      }
    } else if (ruleType?.type === undefined) {
      ruleTypes[ruleName] = {
        type: 'boolean',
        isNullable: ruleType?.isNullable
      }
    } else {
      ruleTypes[ruleName] = {
        type: ruleType.type,
        isNullable: ruleType.isNullable
      }
    }
  }

  return ruleTypes
}

function serializeType(type) {
  const nullable = type.isNullable ? ' | null' : ''

  switch (type.type) {
    case 'string': {
      return `PString${nullable}`
    }
    case 'number': {
      return `number${nullable}`
    }
    case 'boolean': {
      return `PBoolean${nullable}`
    }
    case 'date': {
      return `PDate${nullable}`
    }
    case 'enum': {
      return (
        type.options.map((option) => `"'${option}'"`).join(' | ') + nullable
      )
    }
  }
}
