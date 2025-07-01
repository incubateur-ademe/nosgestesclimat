import fs from 'fs'
import path from 'path'
import Engine, { formatValue } from 'publicodes'

const rules = JSON.parse(
  fs.readFileSync(path.resolve('./nosgestesclimat.model.json'), 'utf-8')
)

const engine = new Engine(rules, {
  warn: {
    cyclicReferences: false
  }
})

const situations = {
  petiteThermiqueEssence: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'petite'",
    'transport . voiture . motorisation': "'thermique'",
    'transport . voiture . thermique . carburant': "'essence E5 ou E10'"
  },
  moyenneThermiqueEssence: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'moyenne'",
    'transport . voiture . motorisation': "'thermique'",
    'transport . voiture . thermique . carburant': "'essence E5 ou E10'"
  },
  VULThermiqueEssence: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'VUL'",
    'transport . voiture . motorisation': "'thermique'",
    'transport . voiture . thermique . carburant': "'essence E5 ou E10'"
  },
  berlineThermiqueEssence: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'berline'",
    'transport . voiture . motorisation': "'thermique'",
    'transport . voiture . thermique . carburant': "'essence E5 ou E10'"
  },
  SUVThermiqueEssence: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'SUV'",
    'transport . voiture . motorisation': "'thermique'",
    'transport . voiture . thermique . carburant': "'essence E5 ou E10'"
  },
  petiteThermiqueDiesel: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'petite'",
    'transport . voiture . motorisation': "'thermique'",
    'transport . voiture . thermique . carburant': "'gazole B7 ou B10'"
  },
  moyenneThermiqueDiesel: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'moyenne'",
    'transport . voiture . motorisation': "'thermique'",
    'transport . voiture . thermique . carburant': "'gazole B7 ou B10'"
  },
  VULThermiqueDiesel: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'VUL'",
    'transport . voiture . motorisation': "'thermique'",
    'transport . voiture . thermique . carburant': "'gazole B7 ou B10'"
  },
  berlineThermiqueDiesel: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'berline'",
    'transport . voiture . motorisation': "'thermique'",
    'transport . voiture . thermique . carburant': "'gazole B7 ou B10'"
  },
  SUVThermiqueDiesel: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'SUV'",
    'transport . voiture . motorisation': "'thermique'",
    'transport . voiture . thermique . carburant': "'gazole B7 ou B10'"
  },
  petiteElectrique: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'petite'",
    'transport . voiture . motorisation': "'électrique'"
  },
  moyenneElectrique: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'moyenne'",
    'transport . voiture . motorisation': "'électrique'"
  },
  VULElectrique: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'VUL'",
    'transport . voiture . motorisation': "'électrique'"
  },
  berlineElectrique: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'berline'",
    'transport . voiture . motorisation': "'électrique'"
  },
  SUVElectrique: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'SUV'",
    'transport . voiture . motorisation': "'électrique'"
  },
  petiteHNR: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'petite'",
    'transport . voiture . motorisation': "'hybride non rechargeable'"
  },
  moyenneHNR: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'moyenne'",
    'transport . voiture . motorisation': "'hybride non rechargeable'"
  },
  VULHNR: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'VUL'",
    'transport . voiture . motorisation': "'hybride non rechargeable'"
  },
  berlineHNR: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'berline'",
    'transport . voiture . motorisation': "'hybride non rechargeable'"
  },
  SUVHNR: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'SUV'",
    'transport . voiture . motorisation': "'hybride non rechargeable'"
  },
  petiteHR: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'petite'",
    'transport . voiture . motorisation': "'hybride rechargeable'"
  },
  moyenneHR: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'moyenne'",
    'transport . voiture . motorisation': "'hybride rechargeable'"
  },
  VULHR: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'VUL'",
    'transport . voiture . motorisation': "'hybride rechargeable'"
  },
  berlineHR: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'berline'",
    'transport . voiture . motorisation': "'hybride rechargeable'"
  },
  SUVHR: {
    'transport . voiture . utilisateur': "'propriétaire'",
    'transport . voiture . gabarit': "'SUV'",
    'transport . voiture . motorisation': "'hybride rechargeable'"
  }
}

console.log(
  'Type de voiture | Construction (kgCO2e/km) | Usage au km (kgCO2e/km) | Total (kgCO2e/km)'
)
for (const [name, situation] of Object.entries(situations)) {
  engine.setSituation(situation)
  const voyageurs = engine.evaluate('transport . voiture . voyageurs').nodeValue
  const usage =
    engine.evaluate('transport . voiture . usage au kilomètre').nodeValue /
    voyageurs
  const construction =
    engine.evaluate('transport . voiture . construction au kilomètre')
      .nodeValue / voyageurs
  const result = usage + construction
  console.log(
    `${name} | ${construction.toFixed(3)} | ${usage.toFixed(3)} | ${result.toFixed(3)}`
  )
}
