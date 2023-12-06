/*
	Checks all personas have been translated.

	Command: yarn check:personas -- [options]
*/

const path = require('path')
const R = require('ramda')
const fs = require('fs')
const yaml = require('yaml')

const cli = require('@incubateur-ademe/nosgestesclimat-scripts/cli')
const utils = require('@incubateur-ademe/nosgestesclimat-scripts/utils')

const { srcLang, destLangs, markdown } = cli.getArgs(
  `Checks all personas have been translated.
`,
  {
    source: true,
    target: true,
    markdown: true
  }
)

const basePersonas = utils.readYAML(
  path.resolve(`personas/personas-${srcLang}.yaml`)
)

cli.printChecksResultTableHeader(markdown)

destLangs.forEach((destLang) => {
  const destPath = `personas/personas-${destLang}.yaml`
  const translatedPersonas = R.mergeAll(
    yaml.parse(fs.readFileSync(destPath, 'utf8'))
  )
  const missingRules = utils.getMissingPersonas(
    basePersonas,
    translatedPersonas
  )
  const missingRuleNames = missingRules.map(
    (obj) => `${obj.personaId} -> ${obj.attr}`
  )

  const nbMissing = missingRules.length

  cli.printChecksResult(
    nbMissing,
    missingRuleNames,
    'personas',
    destLang,
    markdown
  )
  if (
    !markdown &&
    nbMissing > 0 &&
    cli.askYesNo(`Do you want to log missing personas ?`)
  ) {
    missingRules.map(({ personaId: persona, attr }) =>
      console.log(cli.styledRuleNameWithOptionalAttr(persona, attr))
    )
  }
})
