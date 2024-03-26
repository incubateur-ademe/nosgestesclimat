const utils = require('./utils')

const year = 2019

// read files
const readSDES = utils.readJSON(
  `scripts/services-societaux/input/${year}/liste_SDES.json`
)
const SDES_groups = utils.readJSON(
  'scripts/services-societaux/input/SDES_groups.json'
)
const ca_branches = utils.readJSON(
  `scripts/services-societaux/input/${year}/ca_branches.json`
)
const readNAF = utils.readJSON(
  'scripts/services-societaux/input/liste_NAF.json'
)

// Get list of NAF code level 2 as :
// [{
// 	"code_NAF": "A01",
// 	"libellé": "Culture et production animale, chasse et services annexes"
// },
// { "code_NAF": "A02", "libellé": "Sylviculture et exploitation forestière" },
// { "code_NAF": "A03", "libellé": "Pêche et aquaculture" },
// { "code_NAF": "B05", "libellé": "Extraction de houille et de lignite" },
// ...
// }]
const NAF_niveau2 = readNAF.reduce((memo, elt) => {
  const lastId = memo.length > 0 && memo[memo.length - 1].code_NAF
  const currentId = elt.id_1 + elt.id_2
  if (lastId !== currentId) {
    memo.push({
      code_NAF: currentId,
      libellé: elt.label_2
    })
  }
  return memo
}, [])

const findNumber = /\d{2}/
Object.entries(SDES_groups).map(([key, nafGroupObj]) => {
  Object.entries(nafGroupObj).map(([naf, nafObj]) => {
    const nafCode = naf.match(findNumber)[0]
    const findCa = ca_branches.find((obj) => obj.branche === nafCode)
    const ca = findCa && findCa['ca']
    nafObj['ca'] = ca //98 non présent dans 'ca_branches_2017'
  })
  Object.entries(nafGroupObj).map(([naf, nafObj]) => {
    const nafCA = utils.getGroupSum(nafGroupObj)
    const part = utils.getPart(nafObj, nafCA)
    nafObj['part'] = part
  })
  SDES_groups[key] = nafGroupObj
})

const dataSDES = readSDES
  .map((obj) => {
    const CPA = obj['code_CPA'].split('CPA_')[1]
    const composition = CPA.split('_')
    if (composition.length === 1) {
      return {
        ...obj,
        code_CPA: composition[0]
      }
    } else {
      const findNumber = /\d+/
      const findLetter = /[A-Z]/
      const letter = composition[0].match(findLetter)
      const indexes = composition.map((elt) => +elt.match(findNumber))
      const newComposition = Array.from(
        { length: indexes[1] - indexes[0] + 1 },
        (_, i) => letter + String(indexes[0] + i).padStart(2, '0')
      )
      const newObjects = newComposition.map((elt) => {
        const facteur =
          SDES_groups[CPA][elt].part === 'S'
            ? 0
            : SDES_groups[CPA][elt].part / 100
        return {
          code_CPA: elt,
          'Libellé CPA': NAF_niveau2.find((obj) => obj.code_NAF === elt)[
            'libellé'
          ],
          'émissions contenues dans les biens et services adressés à la demande finale de la France':
            utils.roundValue(
              obj[
                'émissions contenues dans les biens et services adressés à la demande finale de la France'
              ] * facteur
            ),
          'émissions de la production intérieure (hors exportations)':
            utils.roundValue(
              obj['émissions de la production intérieure (hors exportations)'] *
                facteur
            ),
          'émissions associées aux importations': utils.roundValue(
            obj['émissions associées aux importations'] * facteur
          )
        }
      })
      return newObjects
    }
  })
  .flat()

// console.log(dataSDES)

utils.writeJSON(
  'scripts/services-societaux/input/SDES_groups.json',
  SDES_groups
)

utils.writeJSON(
  `scripts/services-societaux/output/${year}/liste_SDES_traitée.json`,
  dataSDES
)

console.log(
  '\x1b[32m',
  '- Le fichier `liste_SDES.json` contenant les données de décomposition de l’empreinte carbone de la demande finale de la France a été traité avec succès pour donner `liste_SDES_traitée.json`',
  '\x1b[0m'
)
