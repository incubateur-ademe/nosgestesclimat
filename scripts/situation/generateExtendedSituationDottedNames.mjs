export default function generateExtendedSituationDottedNames(model) {
  const questionDottedNames = Object.keys(model).filter((dottedName) => {
    // In case of empty rule
    if (!model[dottedName]) {
      return false
    }
    // A bit hacky, but we want to exclude imported questions from futureco-data
    if (dottedName.startsWith('futureco-data')) {
      return false
    }

    // We want to exclude questions that are part of a "mosaique" as a mosaique question can't be an publicodes situation entry : it gathers multiple model questions.
    return (
      Object.keys(model[dottedName]).includes('question') &&
      !Object.keys(model[dottedName]).includes('mosaique')
    )
  })
  return questionDottedNames
}
