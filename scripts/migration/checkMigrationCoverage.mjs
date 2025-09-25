import c from 'ansi-colors'

export function checkMigrationCoverage(
  localRules,
  prodRules,
  baseMigration,
  markdown
) {
  const missingMigrationsKeys = []
  const missingMigrationsValues = []
  let nbMissingMigrations = 0

  for (const ruleName in prodRules) {
    const rule = prodRules[ruleName]

    if (!rule || ruleName.startsWith('futureco-data')) {
      continue
    }

    if (rule['question']) {
      if (
        !localRules[ruleName] ||
        (localRules[ruleName] && !localRules[ruleName]['question'])
      ) {
        if (Object.keys(baseMigration['keysToMigrate']).includes(ruleName)) {
          continue
        }
        nbMissingMigrations++
        missingMigrationsKeys.push(ruleName)
      }

      if (rule['une possibilité']) {
        if (!localRules[ruleName]) {
          continue
        }
        const prodPossibilities = rule['une possibilité']
        const localPossibilities = localRules[ruleName]['une possibilité']
        const missingProdPossibilities = prodPossibilities.filter(
          (elt) =>
            !localPossibilities.includes(elt) &&
            !(
              Object.keys(baseMigration['valuesToMigrate']).includes(
                ruleName
              ) &&
              Object.keys(baseMigration['valuesToMigrate'][ruleName]).includes(
                elt
              )
            )
        )
        const missingLocalPossibilities = localPossibilities.filter(
          (elt) =>
            !prodPossibilities.includes(elt) &&
            !(
              Object.keys(baseMigration['valuesToMigrate']).includes(
                ruleName
              ) &&
              Object.values(
                baseMigration['valuesToMigrate'][ruleName]
              ).includes(elt)
            )
        )

        if (missingProdPossibilities.length > 0) {
          nbMissingMigrations++
          missingMigrationsValues.push([
            ruleName,
            [missingProdPossibilities, missingLocalPossibilities]
          ])
        }
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
          '| Règle | Anciennes _possibilités_ | Nouvelles _possibilités_ |'
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
            `| ${rule} | ${valuesToMigrate[0]} | ${valuesToMigrate[1]} |`
          )
        } else {
          console.log(
            `  ${c.magenta(rule)}: ${valuesToMigrate[0]} -> ${valuesToMigrate[1]}`
          )
        }
      })
    }

    throw new Error('Missing migrations')
  } else {
    if (markdown) {
      console.log(`✅ Pas de migration manquante.`)
    } else {
      console.log(c.green('✅ Pas de migration manquante.'))
    }
  }
}
