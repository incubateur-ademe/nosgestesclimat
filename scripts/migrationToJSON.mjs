import fs from 'fs'
import path from 'path'

import utils from '@incubateur-ademe/nosgestesclimat-scripts/utils'

import Engine from 'publicodes'
import c from 'ansi-colors'

import { getLocalRules, getRulesFromDist, getArgs } from '../tests/commons.mjs'

const outputJSONPath = path.join('./public', `migration.json`)

const { country, version, language, markdown } = getArgs()

const baseMigration = utils.readYAML(path.resolve(`migration/migration.yaml`))
const localRules = await getLocalRules(country, language)
const prodRules = await getRulesFromDist(version, country, language)

const localEngine = new Engine(localRules)
const parsedRules = Object.keys(localEngine.getParsedRules())

try {
  checkMigrationFile()
  checkMigrationCoverage()
  writeMigration()
} catch (e) {
  if (!markdown) {
    console.error(e)
    process.exit(1)
  }
}

function checkMigrationFile() {
  let shouldTrhowError = false

  Object.values(baseMigration.keysToMigrate)
    .filter((ruleName) => ruleName !== '')
    .forEach((ruleName) => {
      if (!parsedRules.includes(ruleName)) {
        shouldTrhowError = true
        if (markdown) {
          console.log(`> ❌ The rule ${ruleName} is not present in model`)
        } else {
          console.error(`❌ The rule ${ruleName} is not present in model`)
        }
      }
    })

  Object.entries(baseMigration.valuesToMigrate).forEach(
    ([ruleName, values]) => {
      Object.values(values)
        .filter((value) => value !== '')
        .forEach((value) => {
          const ruleNameToCheck =
            value === 'oui' || value === 'non'
              ? ruleName
              : `${ruleName} . ${value}`
          if (!parsedRules.includes(ruleNameToCheck)) {
            shouldTrhowError = true
            if (markdown) {
              console.log(
                `> ❌ The rule ${ruleNameToCheck} is not present in model`
              )
            } else {
              console.error(
                `❌ The rule ${ruleNameToCheck} is not present in model`
              )
            }
          }
        })
    }
  )

  if (shouldTrhowError) {
    throw new Error('Migration file is not valid')
  }
}

function checkMigrationCoverage() {
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
        if (Object.keys(baseMigration['keysToMigrate']).includes(ruleName)) {
          continue
        }
        nbMissingMigrations++
        missingMigrationsKeys.push(ruleName)
      }

      if (rule.formule?.['une possibilité']) {
        const prodPossibilities =
          rule.formule['une possibilité']['possibilités']
        const localPossibilities =
          localRules[ruleName].formule['une possibilité']['possibilités']
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

        if (
          missingProdPossibilities.length > 0 ||
          missingLocalPossibilities.length > 0
        ) {
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

function writeMigration() {
  fs.writeFile(outputJSONPath, JSON.stringify(baseMigration), function (err) {
    if (err) {
      if (markdown) {
        console.log(
          `| Migration instructions compilation to JSON | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
        )
      } else {
        console.error(
          ` ❌ An error occured while compililing migration instructions to JSON`
        )
        console.error(err)
      }

      return -1
    }
    if (!markdown) {
      console.log('✅ Migration file written')
    }
  })
}
