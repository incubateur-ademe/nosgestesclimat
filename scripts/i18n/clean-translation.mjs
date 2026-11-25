// This script is dirty and should be in @incubateur-ademe/nosgestesclimat-scripts.. But really helpful to clean translations files for now.
import { getArgs } from '@incubateur-ademe/nosgestesclimat-scripts/cli'
import { getModelFromSource } from '@publicodes/tools/compilation'
import { mergeAll } from 'ramda'
import {
  readYAML,
  writeYAML,
  mechanismsToTranslate,
  LOCK_KEY_EXT,
  AUTO_KEY_EXT
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
  ignore: ['data/i18n/**', 'data/utilisateur/utilisateur.publicodes'],
  verbose: !markdown
})

destLangs.forEach((destLang) => {
  const destPath = `data/i18n/t9n/translated-rules-${destLang}.yaml`
  const destRules = mergeAll(readYAML(resolve(destPath)))
  // Check all attributes for each key of destRules and remove it if it's not in rules
  for (const rule in destRules) {
    // Skip if the rule doesn't exist in the source model. An empty rule (`null`)
    // only exists in the source model if another one extends its dotted name.
    if (
      !Object.hasOwn(rules, rule) ||
      (rules[rule] === null && !Object.hasOwn(rules, rule + ' . '))
    ) {
      continue
    }
    const srcRule = rules[rule] ?? {}
    for (const attr in destRules[rule]) {
      if (attr.includes('.')) {
        continue // Skip nested attributes
      }
      if (attr === 'titre') {
        continue // Skip 'titre' attributes, generated for every rule
      }
      // Iterating with `for...in` walks the prototype chain (e.g. `constructor`).
      if (!Object.hasOwn(destRules[rule], attr)) {
        continue
      }
      // Only keep mechanisms that can be translated: `description.lock` can
      // survive in the translation file even when the source attribute is gone.
      if (
        !mechanismsToTranslate.includes(attr) ||
        !Object.hasOwn(srcRule, attr)
      ) {
        delete destRules[rule][attr]
        console.log(
          `Removed ${rule} . ${attr} from ${destLang} translations as it no longer exists in source rules.`
        )
      }
    }
    // Remove the `.auto` and `.lock` attributes of a mechanism which no longer
    // exists in the source rules: they are not translated anymore, but
    // `translate-rules` keeps them as long as the translation key is there.
    for (const attr of mechanismsToTranslate) {
      if (Object.hasOwn(destRules[rule], attr)) {
        continue
      }
      if (Object.hasOwn(srcRule, attr)) {
        continue
      }
      if (!Object.hasOwn(destRules[rule], attr + LOCK_KEY_EXT)) {
        continue
      }
      delete destRules[rule][attr + AUTO_KEY_EXT]
      delete destRules[rule][attr + LOCK_KEY_EXT]
      console.log(
        `Removed ${rule} . ${attr}${AUTO_KEY_EXT} and ${attr}${LOCK_KEY_EXT} from ${destLang} translations as it no longer exists in source rules.`
      )
    }
  }
  writeYAML(destPath, destRules)
})
