export const safeGetSituation = ({
  situation,
  everyRules
}: {
  situation: Record<string, string | number>
  everyRules: string[]
}): any => {
  const unsupportedDottedNamesFromSituation = Object.keys(situation).filter(
    (ruleName) => {
      // We check if the dotteName is a rule of the model
      if (!everyRules.includes(ruleName)) {
        const error = new Error(
          `error trying to use "${ruleName}" from the user situation: the rule doesn't exist in the model`
        )
        console.warn(error)
        return true
      }
      // We check if the value from a mutliple choices question `dottedName`
      // is defined as a rule `dottedName . value` in the model.
      // If not, the value in the situation is an old option, that is not an option anymore.
      if (
        typeof situation[ruleName] === 'string' &&
        situation[ruleName] !== 'oui' &&
        situation[ruleName] !== 'non' &&
        !everyRules.includes(
          `${ruleName} . ${(situation[ruleName] as string)?.replaceAll(
            /^'|'$/g,
            ''
          )}`
        )
      ) {
        const error = new Error(
          `error trying to use "${ruleName}" answer from the user situation: "${situation[ruleName]}" doesn't exist in the model`
        )
        console.warn(error)
        return false
      }
      return false
    }
  )

  const filteredSituation = { ...situation }

  unsupportedDottedNamesFromSituation.map((ruleName: string) => {
    // If a dottedName is not supported in the model, it is dropped from the situation.
    delete filteredSituation[ruleName]
  })

  return filteredSituation
}
