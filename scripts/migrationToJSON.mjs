import fs from 'fs'
import path from 'path'

import cli from '@incubateur-ademe/nosgestesclimat-scripts/cli'
import utils from '@incubateur-ademe/nosgestesclimat-scripts/utils'

import Engine from 'publicodes'
import { disabledLogger } from '@publicodes/tools'
import rules from '../public/co2-model.FR-lang.fr.json' assert { type: 'json' }

const outputJSONPath = './public'

const { markdown } = cli.getArgs(
  `Combines migrations instructions into a JSON file.`,
  {
    source: true,
    markdown: true,
    target: true
  }
)

const writeMigration = (migration, path) => {
  fs.writeFile(path, JSON.stringify(migration), function (err) {
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
    console.log(
      markdown
        ? `| Migration instructions compilation to JSON | :heavy_check_mark: | Ø |`
        : `✅ Migration instructions compilation to JSON`
    )
  })
}

const checkMigrationFile = (migration, parsedRules) => {
  Object.values(migration.keysToMigrate)
    .filter((ruleName) => ruleName !== '')
    .map((ruleName) => {
      if (!parsedRules.includes(ruleName)) {
        if (markdown) {
          console.log(`> ❌ The rule ${ruleName} is not present in model`)
        } else {
          console.error(`❌ The rule ${ruleName} is not present in model`)
        }
      }
    })

  Object.keys(migration.valuesToMigrate).map((ruleName) => {
    Object.values(migration.valuesToMigrate[ruleName])
      .filter((value) => value !== '')
      .map((value) => {
        const ruleNameToCheck =
          value === 'oui' || value === 'non'
            ? ruleName
            : `${ruleName} . ${value}`
        if (!parsedRules.includes(ruleNameToCheck)) {
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
  })
}

const baseMigration = utils.readYAML(path.resolve(`migration/migration.yaml`))

const engine = new Engine(rules, {
  logger: disabledLogger
})

checkMigrationFile(baseMigration, Object.keys(engine.getParsedRules()))

writeMigration(baseMigration, path.join(outputJSONPath, `migration.json`))
