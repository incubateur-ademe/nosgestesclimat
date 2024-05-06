/*
Here is a script that will convert the UI rules to a JSON file
For now, this script only publish funFact rules used in organisation dashboard.
It should contains tests on the content : if a rule is not found, it should raise en error...
It could be extended to publish more rules used in the UI.
*/

import fs from 'fs'
import path from 'path'

const funFactsOutputJSONPath = path.join('./public', `funFactsRules.json`)

const funFactsRules = {
  percentageOfBicycleUsers: 'ui . organisations . transport . roule en vélo',
  percentageOfVegetarians: 'ui . organisations . alimentation . est végétarien',
  percentageOfCarOwners: 'ui . organisations . transport . roule en voiture',
  percentageOfPlaneUsers: "ui . organisations . transport . prend l'avion",
  percentageOfLongPlaneUsers:
    "ui . organisations . transport . prend l'avion long courrier",
  averageOfCarKilometers: 'ui . organisations . transport . km en voiture',
  averageOfTravelers: 'ui . organisations . transport . voyageurs en voiture',
  percentageOfElectricHeating:
    'ui . organisations . logement . chauffage électricité',
  percentageOfGasHeating: 'ui . organisations . logement . chauffage gaz',
  percentageOfFuelHeating: 'ui . organisations . logement . chauffage fioul',
  percentageOfWoodHeating: 'ui . organisations . logement . chauffage bois',
  averageOfElectricityConsumption:
    'ui . organisations . logement . consommation électricité',
  percentageOfCoolingSystem:
    'ui . organisations . logement . possède climatisation',
  percentageOfVegan: 'ui . organisations . alimentation . est végétalien',
  percentageOfRedMeat:
    'ui . organisations . alimentation . fréquence viande rouge',
  percentageOfLocalAndSeasonal:
    'ui . organisations . alimentation . local et de saison',
  percentageOfBottledWater:
    'ui . organisations . alimentation . eau en bouteille',
  percentageOfZeroWaste: 'ui . organisations . alimentation . zéro déchet',
  amountOfClothing: 'ui . organisations . divers . textile',
  percentageOfStreaming: 'ui . organisations . divers . internet'
}

function writeFunFactsFile(outputJSONPath, dataObject) {
  fs.writeFile(outputJSONPath, JSON.stringify(dataObject), function (err) {
    if (err) {
      console.error(` ❌ An error occured while compililing fun facts to JSON`)
      console.error(err)

      return -1
    }

    console.log('✅ FunFacts written')
  })
}

writeFunFactsFile(funFactsOutputJSONPath, funFactsRules)
