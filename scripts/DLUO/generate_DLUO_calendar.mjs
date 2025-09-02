import { getLocalRules } from '../../tests/commons.mjs'

// should be prod rules when working in cron
const rules = await getLocalRules('FR', 'fr')

const dottedNamesWithDLUO = Object.keys(rules).reduce((acc, dottedName) => {
  const rawRuleKeys = new Set(Object.keys(rules[dottedName] ?? {}))

  if (!rawRuleKeys.has('DLUO')) {
    return acc
  }

  if (!acc[rules[dottedName]['DLUO']]) {
    acc[rules[dottedName]['DLUO']] = []
  }

  acc[rules[dottedName]['DLUO']].push(dottedName)
  return acc
}, {})

const DLUOCalendar = Object.fromEntries(
  Object.entries(dottedNamesWithDLUO).sort(
    ([a], [b]) => new Date(a) - new Date(b)
  )
)

// Create a markdown table from DLUOCalendar
const markdownTable = [
  '| DLUO Date | Dotted Names |',
  '|-----------|--------------|',
  ...Object.entries(DLUOCalendar).map(
    ([date, names]) => `| ${date} | ${names.join(', ')} |`
  )
].join('\n')

console.log(markdownTable)
