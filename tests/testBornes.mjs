import { disabledLogger } from '@publicodes/tools'
import c from 'ansi-colors'
import Engine from 'publicodes'
import { readFile } from 'fs/promises'

import { getArgs, getLocalRules } from './commons.mjs'

/**
 * Verify that all numeric rules in the Questions type have min/max bounds
 * (plancher and plafond) defined in the JSON model.
 */

// Extract numeric rule names from types/questions.d.ts
async function extractNumericRules() {
  const typesContent = await readFile('./types/questions.d.ts', 'utf8')

  // Match patterns like: "rule name": number | null
  const numberPattern = /"([^"]+)":\s*number/g
  const matches = [...typesContent.matchAll(numberPattern)]

  return matches.map((m) => m[1])
}

// Check if a rule has plancher and plafond
function checkRuleBounds(rule, ruleData) {
  const hasPlancher = 'plancher' in ruleData
  const hasPlafond = 'plafond' in ruleData

  return {
    rule,
    hasPlancher,
    hasPlafond,
    status: hasPlancher && hasPlafond ? 'OK' : 'MISSING_BOUNDS'
  }
}

const { country = 'FR', language = 'fr' } = getArgs()

const baseRules = await getLocalRules(country, language)

console.log(`\n${c.bold('Testing numeric rules bounds...')}`)
console.log(`Country: ${country}, Language: ${language}\n`)

// Get rules
const numericRules = await extractNumericRules()

console.log(
  `Found ${c.bold(numericRules.length)} numeric rules in Questions type\n`
)

// Check each rule
const results = numericRules.map((ruleName) =>
  checkRuleBounds(ruleName, baseRules[ruleName])
)

// Group by status
const ok = results.filter((r) => r.status === 'OK')
const missingBounds = results.filter((r) => r.status === 'MISSING_BOUNDS')

// Print results
console.log(`${c.green(`✓ ${ok.length}`)} rules with both bounds`)
console.log(`${c.yellow(`⚠ ${missingBounds.length}`)} rules missing bounds`)

if (missingBounds.length > 0) {
  console.log(`${c.bold.yellow('Rules with missing bounds:')}`)
  missingBounds.forEach((r) => {
    console.log(
      `  - ${c.cyan(r.rule)}: plancher=${r.hasPlancher}, plafond=${r.hasPlafond}`
    )
  })
  console.log()
}

// Exit with error if any issues
if (missingBounds.length > 0) {
  console.log(c.red(`\n❌ Test failed: ${missingBounds.length} issues found`))
  process.exit(1)
} else {
  console.log(c.green('\n✅ All numeric rules have proper bounds!'))
  process.exit(0)
}
