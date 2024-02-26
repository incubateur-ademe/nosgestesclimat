import { getArgs, getLocalRules, getRulesFromAPI } from './commons.mjs'
import c from 'ansi-colors'

/*
Plusieurs options : 
- la questions qui était présente dans le modèle initial est supprimée
- la question qui était présente dans le modèle initial est renommée
- la réponse à la question du modèle initial n'est plus une option et doit être supprimée
- la réponse à la question du modèle initial doit être renommée
*/

const { country, version, language, markdown } = getArgs()

const localRules = await getLocalRules(country, language)
const prodRules = await getRulesFromAPI(version, country, language)

const missingMigrationsKeys = []
const missingMigrationsValues = []

let nbMissingMigrations = 0
for (const ruleName in prodRules) {
  const rule = prodRules[ruleName]

  if (!rule || ruleName.startsWith('futureco-data')) {
    continue
  }

  if ((rule['question'] || rule['par défaut']) && !rule['mosaique']) {
    if (!localRules[ruleName]) {
      nbMissingMigrations++
      missingMigrationsKeys.push(ruleName)
      continue
    }

    if (rule.formule?.['une possibilité']) {
      const prodPossibilities = rule.formule['une possibilité']['possibilités']
      const localPossibilities =
        localRules[ruleName].formule['une possibilité']['possibilités']
      const missingProdPossibilities = prodPossibilities.filter(
        (elt) => !localPossibilities.includes(elt)
      )
      const missingLocalPossibilities = localPossibilities.filter(
        (elt) => !prodPossibilities.includes(elt)
      )
      if (
        missingProdPossibilities.length > 0 ||
        missingLocalPossibilities.length > 0
      ) {
        nbMissingMigrations++
        missingMigrationsValues.push([
          ruleName,
          [missingProdPossibilities, missingLocalPossibilities]
        ])
        continue
      }
      continue
    }
  }
}

if (nbMissingMigrations > 0) {
  if (markdown) {
    console.log('### Règles à ajouter à la table de migration\n')
    console.log(
      `> Il y a **${nbMissingMigrations}** cas non couverts par le fichier de migrations.\n`
    )
  } else {
    console.log(`${c.red(nbMissingMigrations + ' règle(s) à migrer:')}\n`)
  }

  if (missingMigrationsKeys.length > 0) {
    if (markdown) {
      console.log('#### Règle à supprimer ou à renommer\n')
    } else {
      console.log('Règle à supprimer ou à renommer:')
    }

    missingMigrationsKeys.forEach((rule) => {
      if (markdown) {
        console.log(`- ${rule}\n`)
      } else {
        console.log(`  ${c.magenta(rule)}`)
      }
    })
  }

  if (missingMigrationsValues.length > 0) {
    if (markdown) {
      console.log('#### `Possibilités` à supprimer ou renommer\n')
      console.log(
        '| Règle | Anciennes `possibilités` | Nouvelles `possibilités` |'
      )
      console.log('| --- | --- | --- |')
    } else {
      console.log(
        '`Possibilités` à supprimer ou renommer à supprimer ou renommer:'
      )
    }

    missingMigrationsValues.forEach(([rule, valuesToMigrate]) => {
      if (markdown) {
        console.log(
          `| \`${rule}\` | ${valuesToMigrate[0]} | ${valuesToMigrate[1]} |`
        )
      } else {
        console.log(
          `  ${c.magenta(rule)}: ${valuesToMigrate[0]} -> ${valuesToMigrate[1]}`
        )
      }
    })
  }
} else {
  if (markdown) {
    console.log(`✅ Toutes les règles ont été migrées.`)
  } else {
    console.log(c.green('✅ Toutes les règles ont été migrées.'))
  }
}
