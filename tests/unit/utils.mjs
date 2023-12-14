import Engine from 'publicodes'
import { getModelFromSource } from '@publicodes/tools/compilation'
import { expect, test, describe } from 'bun:test'

function testOf(
  srcFile,
  macroDescription,
  evaluatedDottedName,
  description,
  situation,
  output
) {
  describe(macroDescription, () => {
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
      expect(evaluated.nodeValue).toStrictEqual(output)
    })
  })
}

export { testOf }
