import fs from 'fs'
import path from 'path'

import utils from '@incubateur-ademe/nosgestesclimat-scripts/utils'

import Engine from 'publicodes'

import { getLocalRules, getRulesFromDist, getArgs } from '../tests/commons.mjs'

import { checkMigrationFile } from './migration/checkMigrationFile.mjs'
import { checkMigrationCoverage } from './migration/checkMigrationCoverage.mjs'

const outputJSONPath = path.join('./public', `migration.json`)

const { country, version, language, markdown } = getArgs()

const baseMigration = utils.readYAML(path.resolve(`migration/migration.yaml`))
const localRules = await getLocalRules(country, language)
const prodRules = await getRulesFromDist(version, country, language)

const localEngine = new Engine(localRules)
const parsedRules = Object.keys(localEngine.getParsedRules())

try {
  checkMigrationFile(localRules, parsedRules, baseMigration, markdown)
  checkMigrationCoverage(localRules, prodRules, baseMigration)
  writeMigration()
} catch (e) {
  if (!markdown) {
    console.error(e)
    process.exit(1)
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
