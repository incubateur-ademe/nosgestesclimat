const utils = require('./utils')

const empreinte_par_branche = utils.readYAML(
  'data/empreinte SDES/empreinte par branche.publicodes'
)

const répartition_autres_produits = utils.readYAML(
  'scripts/services-societaux/input/répartition_autres_produits.yaml'
)

const products_sum = Object.keys(répartition_autres_produits)
const subProducts_sum = Object.fromEntries(products_sum.map((key) => [key, []]))

const rulesToAdd = {}
const findRuleToModify = /^(empreinte branche . )[A-Z]\d{2}( par hab)$/
const data = Object.entries(empreinte_par_branche).map(
  ([ruleName, ruleNode]) => {
    if (!ruleName.match(findRuleToModify)) {
      return [ruleName, ruleNode]
    }
    const code_CPA = ruleName.split(' . ')[1].slice(0, 3)
    products_sum.map((subProduct) => {
      const répartition = répartition_autres_produits[subProduct][code_CPA]
      if (répartition) {
        const newRuleName = `empreinte branche . ${code_CPA} par hab . ${subProduct}`
        rulesToAdd[newRuleName] = {
          titre: `${répartition.ratio} ${ruleNode.titre}`,
          description: répartition.justification,
          formule: `${code_CPA} par hab * ratio ${subProduct}`,
          unité: 'kgCO2e'
        }
        ruleNode['avec'] = {
          ...ruleNode['avec'],
          [`ratio ${subProduct}`]: répartition.ratio
        }
        subProducts_sum[subProduct].push(newRuleName)
      }
    })
    return [ruleName, ruleNode]
  }
)

const dataObject = Object.assign(Object.fromEntries(data), rulesToAdd)

const produits_object = {
  'divers . autres produits macro': {
    titre: 'Empreinte des "Produits neufs" via approche SDES',
    formule: { somme: products_sum },
    unité: 'kgCO2e',
    description:
      'Cette règle correspond à l\'empreinte carbone des achats de produits neufs, non captée "ailleurs" dans le test, pour un français moyen.'
  }
}

products_sum.map((product) => {
  produits_object[`divers . autres produits macro . ${product}`] = {
    formule: { somme: subProducts_sum[product] },
    unité: 'kgCO2e'
  }
})

const messageAuto = `# Ce fichier a été généré automatiquement via le script 'scripts/generate_product_rules.js' dans le dépôt nosgestesclimat.
# Le fichier permettant de modifier les données importantes de répartition et justification de ces produits
# est 'scripts/services-societaux/input/répartition_autres_produits.yaml'. Pour en savoir plus, n'hésitez pas à parcourir notre guide !\n\n`

utils.writeYAML(
  'data/empreinte SDES/empreinte par branche.publicodes',
  dataObject,
  `# Ce fichier a été généré automatiquement via le script 'scripts/generate_services_rules.js' dans le dépôt nosgestesclimat.
# Le fichier permettant de modifier les données importantes de répartition et justification des services sociétaux
# est 'scripts/services-societaux/input/répartition_services_sociétaux.yaml'. Pour en savoir plus, n'hésitez pas à parcourir notre guide !\n\n`
)

utils.writeYAML(
  'data/divers/autres produits macro.publicodes',
  produits_object,
  messageAuto
)

console.log(
  '\x1b[32m',
  '- La règle `data/empreinte SDES/empreinte par branche.publicodess` a été mise à jour avec succès, la règle `divers/autres produits.publicodes` a été écrite avec succès.',
  '\x1b[0m'
)

console.warn('\x1b[33m', 'Veillez à bien vérifier les diff.', '\x1b[0m')
