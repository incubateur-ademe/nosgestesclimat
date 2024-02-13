import { testOf } from './utils.mjs'

const testBornes = ({
  evaluatedDottedName,
  description,
  situation,
  result
}) => {
  testOf(
    'data/**/*.publicodes',
    'Bornes',
    evaluatedDottedName,
    description,
    situation,
    result
  )
}

testBornes({
  evaluatedDottedName: 'transport . voiture . voyageurs',
  description:
    "Lorsque l'utilisateur entre 0 voyageurs, le nombre de voyageurs vaut 1.",
  situation: { 'transport . voiture . voyageurs': 0 },
  result: 1
})

testBornes({
  evaluatedDottedName: 'logement . habitants',
  description:
    "Lorsque l'utilisateur entre 0 personnes dans le logement, le nombre de personnes dans le logement vaut 1.",
  situation: { 'logement . habitants': 0 },
  result: 1
})

testBornes({
  evaluatedDottedName: 'transport . voiture . km',
  description: 'Le nombre de km en voiture ne peut pas être négatif.',
  situation: { 'transport . voiture . km': -1000 },
  result: 0
})

// testBornes({
//   evaluatedDottedName: 'transport . avion . court courrier . heures de vol',
//   description:
//     "Le nombre d'heures en avion court-courrier ne peut-être négatif.",
//   situation: { 'transport . avion . court courrier . heures de vol': -1 },
//   result: 0
// })

// testBornes({
//   evaluatedDottedName: 'transport . avion . moyen courrier . heures de vol',
//   description:
//     "Le nombre d'heures en avion moyen-courrier ne peut-être négatif.",
//   situation: { 'transport . avion . moyen courrier . heures de vol': -1 },
//   result: 0
// })

// testBornes({
//   evaluatedDottedName: 'transport . avion . long courrier . heures de vol',
//   description:
//     "Le nombre d'heures en avion long-courrier ne peut-être négatif.",
//   situation: { 'transport . avion . long courrier . heures de vol': -1 },
//   result: 0
// })

// testBornes({
//   evaluatedDottedName: 'transport . deux roues . km',
//   description: 'Le nombre de km en deux-roues ne peut pas être négatif.',
//   situation: { 'transport . deux roues . km': -1000 },
//   result: 0
// })

// testBornes({
//   evaluatedDottedName: 'transport . bus . heures par semaine',
//   description: "Le nombre d'heures de bus ne peut pas être négatif.",
//   situation: { 'transport . bus . heures par semaine': -1 },
//   result: 0
// })

// testBornes({
//   evaluatedDottedName: 'transport . train . km',
//   description: 'Le nombre de km en deux-roues ne peut pas être négatif.',
//   situation: { 'transport . train . km': -1000 },
//   result: 0
// })

// testBornes({
//   evaluatedDottedName: 'transport . métro ou tram . heures par semaine',
//   description: "Le nombre d'heures de métro ou tram ne peut pas être négatif.",
//   situation: { 'transport . métro ou tram . heures par semaine': -1 },
//   result: 0
// })

testBornes({
  evaluatedDottedName: 'logement . chauffage . biogaz . part',
  description:
    'La part de biogaz dans le contrat de gaz ne peut pas être supérieure à 100%',
  situation: {
    'logement . chauffage . gaz . présent': 'oui',
    'logement . chauffage . gaz . biogaz': 'oui',
    'logement . chauffage . biogaz . part': 150
  },
  result: 100
})

// logement . chauffage . biogaz . part:
//   question: Quelle est la part de biogaz garantie par votre contrat de gaz ?
//   plancher: 0
//   plafond: 100
//   description: |
//     Il existe peu de vendeurs de gaz proposant des contrats 100% biogaz, mais il en existe (en septembre 2022).

//     Par contre, le premier vendeur de gaz français propose à ses clients une option biogaz avec une proportion reglable moyennant un coût supplémentaire (significatif mais qui ne fait pas non plus doubler la facture). N'hésitez pas à en parler à un conseiller.
//   par défaut: 20%
//   unité: '%'

// testBornes({
//   evaluatedDottedName: 'logement . notif minimum habitants',
//   description:
//     "Lorsque l'utilisateur entre 0 personnes dans le logement, une notification apparaît",
//   situation: { 'logement . habitants': 0 },
//   result: true
// })
