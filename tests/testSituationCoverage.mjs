import { getArgs, getLocalRules, getLocalPersonas } from './commons.mjs'
import c from 'ansi-colors'

const { country, language, markdown } = getArgs()

const localRules = await getLocalRules(country, language)
const localPersonas = await getLocalPersonas(country, language)

const questions = []
const emptyQuestions = []
const nbPersonas = Object.keys(localPersonas).length

const ruleNamePrefixToIgrnore = ['futureco-data']

let nbQuestions = 0
for (const ruleName in localRules) {
  const rule = localRules[ruleName]
  const ruleEntry = []

  if (!rule) {
    continue
  }

  if (ruleName.match(`(${ruleNamePrefixToIgrnore.join('|')}).*`)) {
    continue
  }

  if ((rule['question'] || rule['par défaut']) && !rule['mosaique']) {
    nbQuestions++
    Object.values(localPersonas).forEach((persona) => {
      if (ruleName in persona.situation) {
        ruleEntry.push(persona.nom)
      }
    })
    if (ruleEntry.length === 0) {
      emptyQuestions.push(ruleName)
    } else {
      questions.push([ruleName, ruleEntry])
    }
  }
}

if (markdown) {
  console.log('### Questions non couvertes\n')
  console.log(
    `> Il y a **${emptyQuestions.length}** questions non couvertes sur un total de **${nbQuestions}** questions.\n`
  )
  console.log('| Règle | Question | Valeur par défaut |')
  console.log('| --- | --- | --- |')
} else {
  console.log(
    `Uncovered questions: ${c.red(emptyQuestions.length)}/${nbQuestions}\n`
  )
}

emptyQuestions.forEach((rule) => {
  if (markdown) {
    console.log(
      `| ${rule} | ${localRules[rule]['question'] ?? ''} | ${localRules[rule]['par défaut'] ?? ''} |`
    )
  } else {
    console.log(
      `  ${c.magenta(rule)}: ${localRules[rule]['question'] || localRules[rule]['par défaut']}`
    )
  }
})

if (markdown) {
  console.log('\n### Questions couvertes\n')
  console.log('| Règle | Question | Personas |')
  console.log('| --- | --- | --- |')
} else {
  console.log('Covered questions:\n')
}

questions.forEach(([rule, personas]) => {
  if (markdown) {
    console.log(
      `| ${rule} | ${localRules[rule]['question'] || localRules[rule]['par défaut']} | ${personas.join(', ')} |`
    )
  } else {
    console.log(`  ${c.magenta(rule)}: ${personas.length}/${nbPersonas}`)
  }
})
