export default function generateExtendedSituationDottedNames(model) {
  const questionDottedNames = Object.keys(model).filter((dottedName) => {
    if (!model[dottedName]) {
      return false
    }
    // A bit hacky, but we want to exclude imported questions from futureco-data
    if (dottedName.startsWith('futureco-data')) {
      return false
    }

    return (
      Object.keys(model[dottedName]).includes('question') &&
      !Object.keys(model[dottedName]).includes('mosaique')
    )
  })
  return questionDottedNames
}
