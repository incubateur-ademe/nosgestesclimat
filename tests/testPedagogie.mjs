import { getArgs, getLocalRules, printResults } from './commons.mjs'

/**
 * Check pédagogie.publicodes file to ensure that all actions are still valid
 */

const { country, language } = getArgs()

const baseRules = await getLocalRules(country, language)

const actionRules = baseRules['actions']?.formule?.somme

const pedagogieActionRules = Object.keys(baseRules).reduce((acc, rule) => {
  if (rule.startsWith('ui . pédagogie')) {
    const actions = baseRules[rule]?.actions || []
    return acc.concat(actions)
  }
  return acc
}, [])

const missingActions = []
const invalidActions = []

for (const action of pedagogieActionRules) {
  if (!actionRules.includes(action)) {
    invalidActions.push(action)
  }
}

for (const action of actionRules) {
  if (!pedagogieActionRules.includes(action)) {
    missingActions.push(action)
  }
}

console.log(`[ Test pédagogie actions ]\n`)

if (missingActions.length === 0 && invalidActions.length === 0) {
  console.log('All actions are valid!')
  process.exit(0)
} else {
  console.log('Missing actions in pédagogie.publicodes:')
  if (missingActions.length > 0) {
    for (const action of missingActions) {
      console.log(` - ${action}`)
    }
    console.log()
  } else {
    console.log(' - None\n')
  }
  console.log('Invalid actions in pédagogie.publicodes:')
  if (invalidActions.length > 0) {
    for (const action of invalidActions) {
      console.log(` - ${action}`)
    }
    console.log()
  } else {
    console.log(' - None\n')
  }
  process.exit(0)
}
