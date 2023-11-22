import {
  testPersonas,
  printResults,
  getArgs,
  getLocalRules,
  getLocalPersonas
} from './commons.mjs'

const { country, language, markdown } = getArgs()

const localRules = getLocalRules(country, language)
const localPersonas = getLocalPersonas(country, language)

const optimLocalRules = getLocalRules(country, language, true)

Promise.all([optimLocalRules, localPersonas, localRules]).then((res) => {
  const optimResults = testPersonas(res[0], res[1])
  const baseResults = testPersonas(res[2], res[1])
  printResults(optimResults, baseResults, markdown, true)
})
