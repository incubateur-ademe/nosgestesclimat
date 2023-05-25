import { testOf } from './utils'

const testEmballage = (publiProp, descr, inputs, output) => {
    testOf('data/livraison/emballage.yaml', publiProp, descr, inputs, output)
}

testEmballage(
    'livraison colis . emballage',
    'poids, multiplié par l\'empreinte, avec virgule flottante',
    { 'poids emballage': 2.5, 'empreinte carton': 4 },
    10
)

testEmballage(
    'livraison colis . emballage',
    'poids, multiplié par l\'empreinte, sans virgule flottante',
    { 'poids emballage': 80, 'empreinte carton': 2 },
    160
)

testEmballage(
    'livraison colis . empreinte carton',
    'constante, en gCO2e/g',
    {},
    1.29
)

testEmballage(
    'livraison colis . emballage . poids emballage . surface',
    'Surface d\'emballage',
    { 'surface sphère': 12, 'ajustement': 2 },
    14
)

/* Exemple de test sans factorisation
test("livraison colis . emballage : poids emballage * empreinte carton", () => {

    // Given
    const jsonRules = yamlToJson('data/livraison/emballage.yaml');
    const testedRule = pick(jsonRules, 'livraison colis . emballage')
    const inputs = {
        'poids emballage': 80,
        'empreinte carton': 2,
    }

    // When
    const rule = { ...inputs, ...testedRule }
    const engine = new Engine(rule)
    const evaluated = engine.evaluate('livraison colis . emballage')

    // Then
    expect(evaluated.nodeValue).toEqual(160)
})
*/
