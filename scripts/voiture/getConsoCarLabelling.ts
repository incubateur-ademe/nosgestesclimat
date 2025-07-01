import csv from 'csv-parser'
import fs from 'fs'

type PublicodesMotorisation =
  | 'thermique (essence)'
  | 'thermique (diesel)'
  | 'électrique'
  | 'hybride (HR)'
  | 'hybride (HNR)'

type PublicodesSizes = 'petite' | 'moyenne' | 'VUL' | 'berline' | 'SUV'

type Energie =
  | 'ESSENCE'
  | 'GAZOLE'
  | 'ELECTRIC'
  | 'ELEC+ESSENC HR'
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
  'Conso moyenne vitesse Min': number
  'Conso moyenne vitesse Max': number
  'Conso vitesse mixte Min': number
  'Conso vitesse mixte Max': number
  'Conso elec Min': number
  'Conso elec Max': number
}

const getMotorisation = (energie: Energie): PublicodesMotorisation | null => {
  if (energie === 'ELECTRIC') {
    return 'électrique'
  } else if (energie === 'ELEC+ESSENC HR') {
    return 'hybride (HR)'
  } else if (energie?.includes('HNR')) {
    return 'hybride (HNR)'
  } else if (energie === 'GAZOLE') {
    return 'thermique (diesel)'
  } else if (energie === 'ESSENCE' || energie === 'SUPERETHANOL') {
    return 'thermique (essence)'
  } else {
    return null
  }
}

const getSize = (
  Gamme: Gamme,
  Carosserie: Carrosserie,
  poids: number,
  motorisation: PublicodesMotorisation
): PublicodesSizes | null => {
  const petiteTreshold =
    motorisation === 'électrique'
      ? 1700
      : motorisation === 'hybride (HR)'
        ? 1550
        : 1400
  const moyenneTreshold =
    motorisation === 'électrique'
      ? 2000
      : motorisation === 'hybride (HR)'
        ? 1750
        : 1600
  if (Carosserie === 'COMBISPACE') {
    return 'VUL'
  } else if (poids < petiteTreshold) {
    return 'petite'
  } else if (poids >= petiteTreshold && poids < moyenneTreshold) {
    return 'moyenne'
  } else if (poids >= moyenneTreshold) {
    if (Gamme === 'LUXE' || Gamme === 'SUPERIEURE') {
      return 'SUV'
    } else {
      return 'berline'
    }
  } else {
    return null
  }
}

const data: Car[] = []

fs.createReadStream('./scripts/voiture/ademe-car-labelling.csv')
  .pipe(csv({ separator: ';' }))
  .on('data', (row) => {
    const car = {
      ...row,
      'Conso moyenne vitesse Min': parseFloat(row['Conso moyenne vitesse Min']),
      'Conso moyenne vitesse Max': parseFloat(row['Conso moyenne vitesse Max']),
      'Conso vitesse mixte Min': parseFloat(row['Conso vitesse mixte Min']),
      'Conso vitesse mixte Max': parseFloat(row['Conso vitesse mixte Max']),
      'Conso elec Min': parseFloat(row['Conso elec Min']),
      'Conso elec Max': parseFloat(row['Conso elec Max']),
      'Poids à vide': parseFloat(row['Poids à vide'])
    }
    data.push(car)
  })
  .on('end', () => {
    console.log('CSV file successfully processed')
    const results = data.reduce(
      (acc, car) => {
        const {
          'Conso moyenne vitesse Min': consoMin,
          'Conso moyenne vitesse Max': consoMax,
          'Conso vitesse mixte Min': consoHybridMin,
          'Conso vitesse mixte Max': consoHybridMax,
          'Conso elec Min': consoElecMin,
          'Conso elec Max': consoElecMax,
          'Poids à vide': poids,
          Gamme,
          Energie,
          Carrosserie
        } = car

        const motorisation = getMotorisation(Energie)

        if (!motorisation) {
          // ignore cars with unknown motorisation
          return acc
        }

        let conso = 0
        let consoElec = 0

        if (motorisation === 'hybride (HR)') {
          conso = consoHybridMin
            ? (consoHybridMin + consoHybridMax) / 2
            : consoHybridMax
          consoElec = consoElecMin
            ? (consoElecMin + consoElecMax) / 2
            : consoElecMax
        } else {
          conso =
            motorisation === 'électrique'
              ? consoElecMin
                ? (consoElecMin + consoElecMax) / 2
                : consoElecMax
              : consoMin
                ? (consoMin + consoMax) / 2
                : consoMax
        }

        if (!conso || isNaN(conso)) {
          console.warn(
            `Skipping car ${car.Modèle} with invalid consumption: ${consoMin}, ${consoMax}, ${consoElecMin}, ${consoElecMax}`
          )
          return acc
        }

        const size = getSize(Gamme, Carrosserie, poids, motorisation)

        if (!size) {
          console.warn(
            `Skipping car ${car.Modèle} with invalid size: ${Gamme}, ${Carrosserie}, ${poids}`
          )
          return acc
        }

        acc.consoParPoids[size][motorisation] += conso
        acc.effectifParPoids[size][motorisation] += 1
        if (motorisation === 'hybride (HR)') {
          acc.consoParPoids[size]['hybride (HR - elec)'] += consoElec
          acc.effectifParPoids[size]['hybride (HR - elec)'] += 1
        }

        return acc
      },
      {
        consoParPoids: {
          petite: {
            'thermique (essence)': 0,
            'thermique (diesel)': 0,
            électrique: 0,
            'hybride (HR)': 0,
            'hybride (HR - elec)': 0,
            'hybride (HNR)': 0
          },
          moyenne: {
            'thermique (essence)': 0,
            'thermique (diesel)': 0,
            électrique: 0,
            'hybride (HR)': 0,
            'hybride (HR - elec)': 0,
            'hybride (HNR)': 0
          },
          VUL: {
            'thermique (essence)': 0,
            'thermique (diesel)': 0,
            électrique: 0,
            'hybride (HR)': 0,
            'hybride (HR - elec)': 0,
            'hybride (HNR)': 0
          },
          berline: {
            'thermique (essence)': 0,
            'thermique (diesel)': 0,
            électrique: 0,
            'hybride (HR)': 0,
            'hybride (HR - elec)': 0,
            'hybride (HNR)': 0
          },
          SUV: {
            'thermique (essence)': 0,
            'thermique (diesel)': 0,
            électrique: 0,
            'hybride (HR)': 0,
            'hybride (HR - elec)': 0,
            'hybride (HNR)': 0
          }
        },
        effectifParPoids: {
          petite: {
            'thermique (essence)': 0,
            'thermique (diesel)': 0,
            électrique: 0,
            'hybride (HR)': 0,
            'hybride (HR - elec)': 0,
            'hybride (HNR)': 0
          },
          moyenne: {
            'thermique (essence)': 0,
            'thermique (diesel)': 0,
            électrique: 0,
            'hybride (HR)': 0,
            'hybride (HR - elec)': 0,
            'hybride (HNR)': 0
          },
          VUL: {
            'thermique (essence)': 0,
            'thermique (diesel)': 0,
            électrique: 0,
            'hybride (HR)': 0,
            'hybride (HR - elec)': 0,
            'hybride (HNR)': 0
          },
          berline: {
            'thermique (essence)': 0,
            'thermique (diesel)': 0,
            électrique: 0,
            'hybride (HR)': 0,
            'hybride (HR - elec)': 0,
            'hybride (HNR)': 0
          },
          SUV: {
            'thermique (essence)': 0,
            'thermique (diesel)': 0,
            électrique: 0,
            'hybride (HR)': 0,
            'hybride (HR - elec)': 0,
            'hybride (HNR)': 0
          }
        }
      }
    )

    console.log('\nConso moyenne par gabarit:')
    console.log('\n| Gabarit | Motorisation | Conso | Effectif Car Labelling |')
    Object.entries(results.consoParPoids).forEach(([gabarit, conso]) => {
      console.log()
      Object.entries(conso).forEach(([motorisation, conso]) => {
        const nb = results.effectifParPoids[gabarit][motorisation]
        console.log(
          `| ${gabarit} | ${motorisation} | ${(Math.round((100 * conso) / nb) / 100).toLocaleString('fr-FR')} | ${nb} |`
        )
      })
    })
  })
