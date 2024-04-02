const utils = require('./utils')

const year = 2019

const ca_branches = utils.readJSON(
  `scripts/services-societaux/input/${year}/ca_branches.json`
)

const findNumber = /\d{2}/

const data = {}

const ca_lvl2 = Object.values(ca_branches).filter((obj) => {
  branche = obj['branche']
  const findCode = branche.length === 2 && branche.match(findNumber)
  return findCode && findCode[0]
})

Object.values(ca_lvl2).map((nafGroupObj) => {
  const nafCode = nafGroupObj['branche']
  const nafComposition = Object.values(ca_branches).filter((obj) => {
    const branche = obj['branche']
    const findChildren = new RegExp(`${nafCode}[0-9]`)
    const findCode = branche.length === 3 && branche.match(findChildren)
    return findCode
  })
  Object.values(nafComposition).map((nafObj) => {
    nafObj['part'] = ''
  })
  Object.values(nafComposition).map((nafObj) => {
    const nafSubCode = nafObj['branche']
    const nafSubComposition = Object.values(ca_branches).filter((obj) => {
      const branche = obj['branche']
      const findChildren = new RegExp(`${nafSubCode}[0-9]`)
      const findCode = branche.length === 4 && branche.match(findChildren)
      return findCode
    })
    const nafSubCA =
      nafObj['ca'] && nafObj['ca'] !== 'S'
        ? +nafObj['ca']
        : utils.getGroupSum(nafSubComposition)
    nafObj['ca'] = nafSubCA
    Object.values(nafSubComposition).map((nafObj) => {
      const part = utils.getPart(nafObj, nafSubCA)
      nafObj['part'] = part === 'S' ? part : `${part}%`
    })
    nafObj['description'] = nafSubComposition
  })
  const nafCA =
    nafGroupObj['ca'] && nafGroupObj['ca'] !== 'S'
      ? +nafGroupObj['ca']
      : utils.getGroupSum(nafComposition)
  nafGroupObj['ca'] = nafCA
  Object.values(nafComposition).map((nafObj) => {
    const part = utils.getPart(nafObj, nafCA)
    nafObj['part'] = part === 'S' ? part : `${part}%`
  })
  data[nafCode] = { ...nafGroupObj, composition: nafComposition }
  nafGroupObj['composition'] = nafComposition
})

console.log(utils.sortJSON(data))

utils.writeJSON(
  `scripts/services-societaux/output/${year}/analyse_CA_NAF.json`,
  utils.sortJSON(data)
)

console.log(
  '\x1b[32m',
  "- Le fichier `ca_branches.json` contenant les chiffres d'affaires des branches NAF a été traité avec succès pour donner `analyse_CA_NAF.json`",
  '\x1b[0m'
)
