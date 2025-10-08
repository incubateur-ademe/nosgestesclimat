// This script is dirty and should be in @incubateur-ademe/nosgestesclimat-scripts.. But really helpful to clean translations files for now.
import { getArgs } from '@incubateur-ademe/nosgestesclimat-scripts/cli'
import { getModelFromSource } from '@publicodes/tools/compilation'
import { mergeAll } from 'ramda'
import {
  readYAML,
  writeYAML
} from '@incubateur-ademe/nosgestesclimat-scripts/utils'
import { resolve } from 'path'

const { destLangs, srcFile, markdown } = getArgs(
  `Checks all rules have been translated.`,
  {
    source: true,
    target: true,
    file: true,
    markdown: true,
    defaultSrcFile: 'data/**/*.publicodes'
  }
)
const rules = getModelFromSource(srcFile, {
  ignore: ['data/i18n/**'],
  verbose: !markdown
})

destLangs.forEach((destLang) => {
  const destPath = `data/i18n/t9n/translated-rules-${destLang}.yaml`
  const destRules = mergeAll(readYAML(resolve(destPath)))
  // Check all attributes for each key of destRules and remove it if it's not in rules
  for (const rule in destRules) {
    for (const attr in destRules[rule]) {
      if (attr.includes('.')) {
        break // Skip nested attributes
      }
      if (attr === 'titre') {
        break // Skip 'titre' attributes
      }
      if (!Object.hasOwn(rules[rule], attr)) {
        delete destRules[rule][attr]
        console.log(
          `Removed ${rule} . ${attr} from ${destLang} translations as it no longer exists in source rules.`
        )
      }
    }
  }
  writeYAML(destPath, destRules)
})
