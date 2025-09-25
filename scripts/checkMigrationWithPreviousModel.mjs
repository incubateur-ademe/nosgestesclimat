import path from 'path'
import utils from '@incubateur-ademe/nosgestesclimat-scripts/utils'
import {
  getRulesFromPreviousRelease,
  getLocalRules,
  getArgs
} from '../tests/commons.mjs'
import { checkMigrationCoverage } from './migration/checkMigrationCoverage.mjs'

const { country, language } = getArgs()

const baseMigration = utils.readYAML(path.resolve(`migration/migration.yaml`))

const localRules = await getLocalRules(country, language)

// List of all release tags since the beginning of the project
// Macos : git tag | egrep -v '\-(rc|beta|alpha)\.' | sed 's/^v//' | sed 's/^/"/;s/$/"/' | awk '{printf "%s%s", sep, $0; sep=","}' | sed 's/^/[/' | sed 's/$/]/' | pbcopy

const releaseTags = [
  '1.1.0',
  '1.2.0',
  '1.3.0',
  '1.5.0',
  '2.0.0',
  '2.1.0',
  '2.2.0',
  '2.3.0',
  '2.4.0',
  '2.5.0',
  '3.0.0',
  '3.1.0',
  '3.2.0',
  '1.0.3',
  '1.0.4',
  '1.0.5',
  '1.1.0',
  '1.1.1',
  '1.2.0',
  '1.2.1',
  '1.3.0',
  '1.5.0',
  '1.5.2',
  '1.5.3',
  '1.5.4',
  '1.5.5',
  '2.0.0',
  '2.0.1',
  '2.0.2',
  '2.1.0',
  '2.1.1',
  '2.1.2',
  '2.1.3',
  '2.1.4',
  '2.1.5',
  '2.2.0',
  '2.3.0',
  '2.4.0',
  '2.4.1',
  '2.4.2',
  '2.5.0',
  '2.5.1',
  '2.5.2',
  '2.5.3',
  '2.5.4',
  '2.5.5',
  '2.5.6',
  '3.0.0',
  '3.1.0',
  '3.1.1',
  '3.10.0',
  '3.11.0',
  '3.11.1',
  '3.11.2',
  '3.12.0',
  '3.2.0',
  '3.3.2',
  '3.3.3',
  '3.3.4',
  '3.4.0',
  '3.4.3',
  '3.5.0',
  '3.5.1',
  '3.5.2',
  '3.5.3',
  '3.5.4',
  '3.6.0',
  '3.6.1',
  '3.6.2',
  '3.7.0',
  '3.7.1',
  '3.7.2',
  '3.7.3',
  '3.7.4',
  '3.8.0',
  '3.8.1',
  '3.8.2',
  '3.8.3',
  '3.9.0'
]

for (const tag of releaseTags) {
  try {
    console.log(`\n=== Checking migration coverage for release: ${tag} ===`)
    const oldRules = await getRulesFromPreviousRelease(tag, country, language)
    checkMigrationCoverage(localRules, oldRules, baseMigration)
  } catch (e) {
    console.error(`Error for tag ${tag}:`, e)
    continue
  }
}
