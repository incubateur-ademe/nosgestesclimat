/*
	Calls the DeepL API to translate the rule questions, titles, notes,
	summaries and suggestions.

	Command: yarn translate -- [options]
*/

import { resolve } from 'path'
import { mergeAll, assocPath } from 'ramda'
import { exit } from 'process'
import c from 'ansi-colors'

import {
  LOCK_KEY_EXT,
  AUTO_KEY_EXT,
  PREVIOUS_REVIEW_KEY_EXT,
  writeYAML,
  readYAML,
  getMissingRules
} from '@incubateur-ademe/nosgestesclimat-scripts/utils'

import {
  getArgs,
  printInfo,
  printWarn,
  printErr,
  styledRuleNameWithOptionalAttr,
  styledPromptActions
} from '@incubateur-ademe/nosgestesclimat-scripts/cli'

import {
  fetchTranslation,
  fetchTranslationMarkdown
} from '@incubateur-ademe/nosgestesclimat-scripts/deepl'
import gitDiff from 'git-diff'
import { getModelFromSource } from '@publicodes/tools/compilation'
import createPrompt from 'prompt-sync'

const prompt = createPrompt()

const { srcLang, destLangs, srcFile, onlyUpdateLocks, interactiveMode } =
  getArgs(
    `Calls the DeepL API to translate the rule questions, titles, notes,
	summaries and suggestions.`,
    {
      source: true,
      target: true,
      file: true,
      onlyUpdateLocks: true,
      defaultSrcFile: 'data/**/*.publicodes',
      interactiveMode: true
    }
  )

const cmds = [
  { info: 'translate', cmd: 't' },
  { info: 'update .lock attribute', cmd: 'u' },
  { info: 'skip', cmd: 's' },
  { info: 'print current translation', cmd: 'p' },
  { info: 'abort', cmd: 'a' }
]

const abrvs = cmds.map(({ cmd }) => cmd)

const translateTo = async (
  srcLang,
  destLang,
  destPath,
  entryToTranslate,
  translatedRules
) => {
  let previoulsyReviewedTranslations = []
  let skippedValues = []
  let skippedTranslations = []

  const updateTranslatedRules = (
    rule,
    attr,
    transVal,
    refVal,
    onlyNeedToUpdateLocks
  ) => {
    let key = [rule, attr]
    let refKey = [rule, attr + LOCK_KEY_EXT]
    let autoKey = [rule, attr + AUTO_KEY_EXT]
    let previousKey = [rule, attr + PREVIOUS_REVIEW_KEY_EXT]
    let currentVal = translatedRules[rule] && translatedRules[rule][attr]

    if ('mosaique' === attr) {
      key = [rule, attr, 'suggestions']
      refKey = [rule, attr, 'suggestions' + LOCK_KEY_EXT]
      previousKey = [rule, attr, 'suggestions' + PREVIOUS_REVIEW_KEY_EXT]
      autoKey = [rule, attr, 'suggestions' + AUTO_KEY_EXT]
      currentVal =
        translatedRules[rule] &&
        translatedRules[rule][attr] &&
        translatedRules[rule][attr]['suggestions']
    }
    if (
      currentVal &&
      translatedRules[rule][attr + AUTO_KEY_EXT] &&
      translatedRules[rule][attr] !==
        translatedRules[rule][attr + AUTO_KEY_EXT] &&
      !onlyNeedToUpdateLocks
    ) {
      // The previous translated value has been manually edited, we notify the user.
      translatedRules = assocPath(previousKey, currentVal, translatedRules)
      previoulsyReviewedTranslations.push(`${rule} -> ${attr}`)
    }

    if (!onlyNeedToUpdateLocks) {
      translatedRules = assocPath(key, transVal, translatedRules)
      translatedRules = assocPath(autoKey, transVal, translatedRules)
    }
    translatedRules = assocPath(refKey, refVal, translatedRules)
  }
  const translate = (value) => {
    return fetchTranslation(
      value,
      srcLang.toUpperCase(),
      destLang.toUpperCase()
    )
  }
  const translateMarkdown = (value) => {
    return fetchTranslationMarkdown(
      value,
      srcLang.toUpperCase(),
      destLang.toUpperCase()
    )
  }

  await Promise.all(
    Object.values(entryToTranslate).map(async ({ rule, attr, refVal }) => {
      let answer
      if (interactiveMode) {
        const translatedRule = translatedRules[rule]
        const isNewRule = translatedRule === undefined
        const isNewAttr = isNewRule || translatedRule[attr] === undefined
        const newVal =
          isNewRule || isNewAttr ? '' : translatedRule[attr + LOCK_KEY_EXT]
        const diff = gitDiff(newVal, refVal, {
          color: true,
          forceFake: true
        })
        console.log(
          `\n${c.dim('---')} ${c.green.italic(
            isNewRule ? 'NEW RULE' : 'MODIFIED RULE'
          )} ${c.dim('---------------------------')}`
        )
        console.log(`\n${styledRuleNameWithOptionalAttr(rule, attr)}\n${diff}`)
        console.log(
          `${c.dim(
            `----${
              isNewRule ? '---------' : '--------------'
            }---------------------------`
          )}`
        )
        do {
          if (answer === 'p') {
            console.log(`${c.dim('')}${translatedRules[rule][attr]}`)
          }
          answer = prompt(c.dim(`(${abrvs.join()}): `))
        } while (!abrvs.includes(answer))
      }
      if (answer === 'a') {
        console.log('Exiting...')
        exit(0)
      } else if (answer === 's') {
        return skippedValues.push({ rule, msg: 'skipped' })
      }

      const onlyNeedToUpdateLocks = onlyUpdateLocks || answer === 'u'

      try {
        const translatedValue = onlyNeedToUpdateLocks
          ? undefined
          : 'description' === attr || 'note' === attr || 'avertissement' === attr
            ? await translateMarkdown(refVal)
            : await translate(refVal)

        if (!translatedValue && !onlyNeedToUpdateLocks) {
          skippedValues.push({
            rule,
            msg: 'an error occurred while translating'
          })
        } else {
          if (onlyNeedToUpdateLocks) {
            skippedTranslations.push(rule)
          }
          updateTranslatedRules(
            rule,
            attr,
            translatedValue,
            refVal,
            onlyNeedToUpdateLocks
          )
        }
      } catch (err) {
        skippedValues.push({ rule, msg: err.message })
      }
    })
  )

  skippedTranslations.forEach((rule) => {
    printInfo(`[INFO] - '${rule}': only the reference value has been updated`)
  })
  skippedValues.forEach(({ rule, msg }) => {
    printWarn(`[SKIPPED] - '${rule}': ${msg}`)
  })
  previoulsyReviewedTranslations.forEach((rule) => {
    printErr(
      `[PREVIOUSLY REVIEWED] - '${rule}': previous translation has been previously corrected by hand`
    )
  })
  console.log(`Writing translated rules to: ${destPath}`)
  writeYAML(destPath, translatedRules)
}

const rules = getModelFromSource(srcFile, {
  ignore: ['data/i18n/**'],
  verbose: true
})

destLangs.forEach(async (destLang) => {
  const destPath = resolve(`data/i18n/t9n/translated-rules-${destLang}.yaml`)
  const destRules = mergeAll(readYAML(destPath))
  console.log(`Getting missing rule for ${destLang}...`)
  let missingRules = getMissingRules(rules, destRules)

  if (0 < missingRules.length) {
    console.log(
      `Translating ${c.green(missingRules.length)} new entries to ${c.yellow(
        destLang
      )}...`
    )
    if (interactiveMode) {
      console.log(
        `For each rule, you can choose to:\n\n${styledPromptActions(
          cmds.map(({ info }) => info),
          '\n'
        )}`
      )
    }

    translateTo(srcLang, destLang, destPath, missingRules, destRules)
  } else {
    console.log(`Found no new entry to translate...`)
  }
})
