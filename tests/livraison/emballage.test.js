import Engine from 'publicodes'
import { pick, yamlToJson } from './utils'

test("livraison colis . emballage : poids emballage * empreinte carton", () => {

    // Given
    const jsonRules = yamlToJson('data/livraison/emballage.yaml');
    const testedRule = pick(jsonRules,'livraison colis . emballage')
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

