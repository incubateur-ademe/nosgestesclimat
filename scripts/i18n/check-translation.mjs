/*
	Checks all rules have been translated.

	Command: yarn check:rules -- [options]
*/
import c from 'ansi-colors'
import { resolve } from 'path'
import { mergeAll } from 'ramda'
import {
  getArgs,
  askYesNo,
  styledRuleNameWithOptionalAttr,
  ask,
  printChecksResultTableHeader,
  printChecksResult
} from '@incubateur-ademe/nosgestesclimat-scripts/cli'
import {
  writeYAML,
  readYAML,
  getMissingRules,
  getNotUpToDateRuleTranslations
} from '@incubateur-ademe/nosgestesclimat-scripts/utils'
import { getModelFromSource } from '@publicodes/tools/compilation'

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

function manageNotUpToDateRuleTranslations(
  notUpToDateTranslationRules,
  destPath,
  destRules
) {
  let removed = false
  console.log(
    `⚠️ There are ${c.yellow(
      notUpToDateTranslationRules.length
    )} not up-to-date rule translations:`
  )
  if (askYesNo(`Do you want to log them?`)) {
    notUpToDateTranslationRules.forEach((rule) =>
      console.log(styledRuleNameWithOptionalAttr(rule))
    )
  }
  switch (ask(`Do you want to remove them?`, ['all', 'one', 'none'])) {
    case 'a': {
      removed = true
      notUpToDateTranslationRules.forEach((rule) => {
        delete destRules[rule]
      })
      break
    }
    case 'o': {
      notUpToDateTranslationRules.forEach((rule) => {
        if (
          askYesNo(
            `Do you want to remove ${styledRuleNameWithOptionalAttr(rule)}?`
          )
        ) {
          removed = true
          delete destRules[rule]
        }
      })
      break
    }
    default: {
      break
    }
  }
  if (removed) {
    console.log(`Writing updated rules translations to: ${destPath}`)
    writeYAML(destPath, destRules)
  }
}

const rules = getModelFromSource(srcFile, {
  ignore: ['data/i18n/**'],
  verbose: !markdown
})

printChecksResultTableHeader(markdown)

destLangs.forEach((destLang) => {
  const destPath = `data/i18n/t9n/translated-rules-${destLang}.yaml`
  const destRules = mergeAll(readYAML(resolve(destPath)))
  const missingRules = getMissingRules(rules, destRules)
  const missingRuleNames = missingRules.map((obj) =>
    markdown
      ? `<li><b>${obj.rule}</b> > ${obj.attr}</li>`
      : styledRuleNameWithOptionalAttr(obj.rule, obj.attr)
  )
  const nbMissing = missingRules.length

  printChecksResult(nbMissing, missingRuleNames, 'rules', destLang, markdown)

  if (
    !markdown &&
    nbMissing > 0 &&
    askYesNo(`Do you want to log missing rules?`)
  ) {
    missingRules.map(({ rule: ruleName, attr }) =>
      console.log(styledRuleNameWithOptionalAttr(ruleName, attr))
    )
  }

  const notUpToDateRuleTranslations = getNotUpToDateRuleTranslations(
    rules,
    destRules
  )
  const nbNotUpToDate = notUpToDateRuleTranslations.length

  if (nbNotUpToDate > 0) {
    if (markdown) {
      printChecksResult(
        nbNotUpToDate,
        notUpToDateRuleTranslations.map((rule) => `<li><b>${rule}</b></li>`),
        'rules (not up-to-date)',
        destLang,
        markdown
      )
    } else {
      manageNotUpToDateRuleTranslations(
        notUpToDateRuleTranslations,
        destPath,
        destRules
      )
    }
  }
})
