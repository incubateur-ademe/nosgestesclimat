import {
  testPersonas,
  printResults,
  getArgs,
  getLocalRules,
  getLocalPersonas,
  getRulesFromAPI,
  getPersonasFromAPI
} from './commons.mjs'

const { country, language, markdown, version } = getArgs()

const localRules = getLocalRules(country, language)
const localPersonas = getLocalPersonas(country, language)

const prodRules = getRulesFromAPI(version, country, language)
const prodPersonas = getPersonasFromAPI(version, country, language)

Promise.all([localRules, localPersonas, prodRules, prodPersonas]).then(
  (res) => {
    const localResults = testPersonas(res[0], res[1])
    const prodResults = testPersonas(res[2], res[3])
    printResults(localResults, prodResults, markdown, version)
  }
)
