import {
  testPersonas,
  printResults,
  getArgs,
  getLocalRules,
  getLocalPersonas,
  getProdRules,
  getProdPersonas
} from './commons.mjs'

const { country, language, markdown } = getArgs()

const localRules = getLocalRules(country, language)
const localPersonas = getLocalPersonas(country, language)

const prodRules = getProdRules(country, language)
const prodPersonas = getProdPersonas(country, language)

Promise.all([localRules, localPersonas, prodRules, prodPersonas]).then(
  (res) => {
    const localResults = testPersonas(res[0], res[1])
    const prodResults = testPersonas(res[2], res[3])
    printResults(localResults, prodResults, markdown)
  }
)
