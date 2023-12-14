const Engine = require('publicodes').default
const { getModelFromSource } = require('@publicodes/tools/compilation')

function testOf(srcFile, evaluatedDottedName, description, situation, output) {
  test(`${evaluatedDottedName} ${description}`, () => {
    // Given
    const rules = getModelFromSource(srcFile, {
      ignore: ['data/i18n/**']
    })
    // When
    const engine = new Engine(rules)
    engine.setSituation(situation)
    const evaluated = engine.evaluate(evaluatedDottedName)

    // Then
    expect(evaluated.nodeValue).toEqual(output)
  })
}

function sum(a, b) {
  return a + b
}

module.exports = { testOf, sum }
