import { RULES_TO_KEEP_AS_QUESTION } from './constants.mjs'

export function checkMigrationFile(
  localRules,
  parsedRules,
  baseMigration,
  markdown
) {
  let shouldThrowError = false

  Object.values(baseMigration.keysToMigrate)
    .filter((ruleName) => ruleName !== '')
    .forEach((ruleName) => {
      if (!parsedRules.includes(ruleName)) {
        shouldThrowError = true
        if (markdown) {
          console.log(`> ❌ The rule ${ruleName} is not present in model`)
        } else {
          console.error(`❌ The rule ${ruleName} is not present in model`)
        }
      }
      if (
        parsedRules.includes(ruleName) &&
        !localRules[ruleName].question &&
        !RULES_TO_KEEP_AS_QUESTION.includes(ruleName)
      ) {
        shouldThrowError = true
        if (markdown) {
          console.log(`> ❌ The rule ${ruleName} is not a question anymore`)
        } else {
          console.error(`❌ The rule ${ruleName} is not a question anymore`)
        }
      }
    })

  Object.entries(baseMigration.valuesToMigrate).forEach(
    ([ruleName, values]) => {
      Object.values(values)
        .filter((value) => value !== '')
        .forEach((value) => {
          const ruleNameToCheck =
            value === 'oui' || value === 'non'
              ? ruleName
              : `${ruleName} . ${value}`
          if (!parsedRules.includes(ruleNameToCheck)) {
            shouldThrowError = true
            if (markdown) {
              console.log(
                `> ❌ The rule ${ruleNameToCheck} is not present in model`
              )
            } else {
              console.error(
                `❌ The rule ${ruleNameToCheck} is not present in model`
              )
            }
          }
        })
    }
  )

  if (shouldThrowError) {
    throw new Error('Migration file is not valid')
  }
}
