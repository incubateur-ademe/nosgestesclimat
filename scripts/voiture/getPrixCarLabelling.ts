// Script from Emile Rolley : https://github.com/betagouv/publicodes-voiture/blob/main/scripts/carlabelling-compute.ts.
import csv from 'csv-parser'
import fs from 'fs'

// TODO: automatically generate this type from the compilation of the Publicodes model
type PublicodesMotorisation = 'thermique' | 'électrique' | 'hybride'

type Energie =
  | 'ESSENCE'
  | 'GAZOLE'
  | 'ELECTRIC'
  | 'ELEC+ESSENCE HR'
  | 'ELEC+GAZOLE HR'
  | 'ESS+ELEC HNR'
  | 'ESS+G.P.L.'
  | 'GAZ+ELEC HNR'
  | 'SUPERETHANOL'

type Carrosserie =
  | 'BERLINE'
  | 'BREAK'
  | 'CABRIOLET'
  | 'COMBISPACE'
  | 'COUPE'
  | 'MINIBUS'
  | 'MINISPACE'
  | 'MONOSPACE'
  | 'MONOSPACE COMPACT'
  | 'TS TERRAINS/CHEMINS'

type Gamme =
  | 'ECONOMIQUE'
  | 'INFERIEURE'
  | 'LUXE'
  | 'MOYENNE INFERIEURE'
  | 'MOYENNE SUPERIEURE'
  | 'SUPERIEURE'

type Car = {
  Energie: Energie
  Carrosserie: Carrosserie
  Gamme: Gamme
  Modèle: string
  'Poids à vide': number
  'Conso vitesse mixte Min': number
  'Conso vitesse mixte Max': number
  'Prix véhicule': number
}

const getMotorisation = (energie: Energie): PublicodesMotorisation => {
  if (energie === 'ELECTRIC') {
    return 'électrique'
  } else if (energie?.includes('HR') || energie?.includes('HNR')) {
    return 'hybride'
  } else {
    return 'thermique'
  }
}

const data: Car[] = []

fs.createReadStream('./scripts/voiture/ademe-car-labelling.csv')
  .pipe(csv({ separator: ';' }))
  .on('data', (row) => {
    const car = {
      ...row,
      'Poids à vide': parseFloat(row['Poids à vide']),
      'Prix véhicule': parseFloat(row['Prix véhicule'])
    }
    data.push(car)
  })
  .on('end', () => {
    console.log('CSV file successfully processed')
    const results = data.reduce(
      (acc, car) => {
        const {
          'Prix véhicule': prix,
          'Poids à vide': poids,
          Gamme,
          Energie
        } = car

        // Ignore the LUXE gamme to avoid skewing the results
        if (Gamme === 'LUXE' || Gamme === 'SUPERIEURE') {
          return acc
        }

        const motorisation = getMotorisation(Energie)

        if (poids < 1250) {
          acc.prixParPoids['< 1250'][motorisation] += prix
          acc.effectifParPoids['< 1250'][motorisation] += 1
        } else if (poids < 1500) {
          acc.prixParPoids['1250-1500'][motorisation] += prix
          acc.effectifParPoids['1250-1500'][motorisation] += 1
        } else if (poids < 1750) {
          acc.prixParPoids['1500-1750'][motorisation] += prix
          acc.effectifParPoids['1500-1750'][motorisation] += 1
        } else if (poids < 2000) {
          acc.prixParPoids['1750-2000'][motorisation] += prix
          acc.effectifParPoids['1750-2000'][motorisation] += 1
        } else {
          acc.prixParPoids['> 2000'][motorisation] += prix
          acc.effectifParPoids['> 2000'][motorisation] += 1
        }

        return acc
      },
      {
        prixParPoids: {
          '< 1250': {
            thermique: 0,
            électrique: 0,
            hybride: 0
          },
          '1250-1500': {
            thermique: 0,
            électrique: 0,
            hybride: 0
          },
          '1500-1750': {
            thermique: 0,
            électrique: 0,
            hybride: 0
          },
          '1750-2000': {
            thermique: 0,
            électrique: 0,
            hybride: 0
          },
          '> 2000': {
            thermique: 0,
            électrique: 0,
            hybride: 0
          }
        },
        effectifParPoids: {
          '< 1250': {
            thermique: 0,
            électrique: 0,
            hybride: 0
          },
          '1250-1500': {
            thermique: 0,
            électrique: 0,
            hybride: 0
          },
          '1500-1750': {
            thermique: 0,
            électrique: 0,
            hybride: 0
          },
          '1750-2000': {
            thermique: 0,
            électrique: 0,
            hybride: 0
          },
          '> 2000': {
            thermique: 0,
            électrique: 0,
            hybride: 0
          }
        }
      }
    )

    console.log('\nPrix moyen par poids:')
    Object.entries(results.prixParPoids).forEach(([poids, prix]) => {
      console.log()
      Object.entries(prix).forEach(([motorisation, prix]) => {
        const nb = results.effectifParPoids[poids][motorisation]
        console.log(
          `| ${poids} | ${motorisation} | ${Math.round(prix / nb).toLocaleString('fr-FR')} | ${nb} |`
        )
      })
    })
  })
