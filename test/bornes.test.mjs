import { testOf, sum } from './utils.mjs'

const testBornes = (evaluatedDottedName, description, situation, result) => {
  testOf(
    'data/**/*.publicodes',
    evaluatedDottedName,
    description,
    situation,
    result
  )
}

test('adds 1 + 2 to equal 3', () => {
  expect(sum(1, 2)).toBe(3)
})

testBornes(
  'transport . voiture . voyageurs',
  "Lorsque l'utilisateur entre 0 voyageurs, le nombre de voyageurs vaut 1.",
  { 'transport . voiture . saisie voyageurs': 0 },
  1
)
