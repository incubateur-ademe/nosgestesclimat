import fs from 'fs'
import path from 'path'
import YAML from 'yaml'
import 'dotenv/config'

const version = 'latest'
const ecobalyseAPI =
  version === 'latest'
    ? `https://ecobalyse.beta.gouv.fr/api/textile/simulator`
    : `https://ecobalyse.beta.gouv.fr/versions/v${version}/api/textile/simulator`

const products = JSON.parse(
  fs.readFileSync(path.resolve('scripts/ecobalyse/products.json'), 'utf-8')
)

const textileRulesFile = path.resolve('data/divers/textile.publicodes')

const textileRules = YAML.parse(fs.readFileSync(textileRulesFile, 'utf-8'))

if (!process.env.ECOBALYSE_API_TOKEN) {
  console.error(
    'ECOBALYSE_API_TOKEN is not defined in the environment variables. Make sure to run your script from root.'
  )
  process.exit(1)
}

const fetchData = async (request) => {
  const response = await fetch(ecobalyseAPI, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      token: process.env.ECOBALYSE_API_TOKEN
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    throw new Error('No response from API')
  }

  const data = await response.json()
  return data
}

const getImpactFromAPI = async (request) => {
  try {
    const data = await fetchData(request)
    return data
  } catch (error) {
    console.error('Error fetching data:', error)
  }
}

const defaultRequest = {
  business: 'large-business-without-services',
  disabledSteps: ['use', 'eol'], // We exclude use and end of life steps
  materials: [
    {
      id: 'ei-coton',
      share: 1
    }
  ],
  numberOfReferences: 1000, // We set numberOfReferences and price so we can set custom durability factor (to 1)
  physicalDurability: 1,
  price: 100,
  traceability: false,
  trims: [],
  upcycled: false
}

const productImpacts = await Object.keys(products).reduce(
  async (acc, product) => {
    let collection = await acc
    const productData = products[product]
    const request = {
      ...defaultRequest,
      ...productData
    }
    const result = await getImpactFromAPI(request)
    collection[product] = {
      cch: Math.round(result.impacts.cch * 100) / 100,
      wtu: Math.round(result.impacts.wtu * 1000),
      description: result.description,
      url: result.webUrl
    }
    return collection
  },
  Promise.resolve({})
)

let hasChanged = false
let diff = ''
let lines = fs.readFileSync(textileRulesFile, 'utf-8').split('\n')

const checkAndUpdateDiff = (impactType, product) => {
  const ruleName =
    impactType === 'cch'
      ? `divers . textile . ${product} . empreinte carbone . hors durabilité`
      : 'wtu'
        ? `divers . textile . ${product} . empreinte eau . hors durabilité`
        : ''

  const newImpact = productImpacts[product][impactType]

  if (newImpact !== textileRules[ruleName].formule) {
    if (hasChanged === false) {
      hasChanged = true
    }
    diff += `\n${ruleName} : ${textileRules[ruleName].formule} => ${newImpact}`
    const ruleLineIndex = lines.findIndex(
      (line) => line && line.startsWith(ruleName)
    )
    if (ruleLineIndex === -1) {
      console.error(`Rule ${ruleName} not found in textile rules file.`)
      return
    }
    lines[ruleLineIndex + 1] = `  formule: ${newImpact}`
    lines[ruleLineIndex + 3] =
      `  note: |\n` +
      lines[ruleLineIndex + 4] +
      `\n\n    Description technique: ${productImpacts[product].description}` +
      `\n\n    URL de simulation: ${productImpacts[product].url}`
    lines.splice(ruleLineIndex + 4, 5)
  }
}

for (const product in productImpacts) {
  // Climate Change
  checkAndUpdateDiff('cch', product)

  // Water Use
  checkAndUpdateDiff('wtu', product)
}

if (hasChanged) {
  console.log('Ecobalyse impacts have been updated.')
  console.log(diff)
  fs.writeFileSync(textileRulesFile, lines.join('\n'), 'utf-8')
  console.log('Rules have been updated.')
} else {
  console.log('No changes detected.')
}
