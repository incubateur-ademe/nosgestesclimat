import Engine from 'publicodes'
import { parse } from 'yaml'
import { extractRule, yamlToJson } from './utils'
const fs = require('fs');

test("Importé. livraison colis . emballage : poids emballage * empreinte carton", () => {

    // Given
    const rules = yamlToJson('data/livraison/emballage.yaml');
    console.log('rules', rules);

    const inputs = {
        'poids emballage': 80,
        'empreinte carton': 2,
    }

    const testedRule = extractRule('livraison colis . emballage', rules)
    console.log('testedRule', testedRule);

    const actualRules = { ...inputs, ...testedRule }
    console.log('actualRules', actualRules);
    const engine = new Engine(actualRules)

    // When
    const evaluated = engine.evaluate('livraison colis . emballage')
    // Then
    expect(evaluated.nodeValue).toEqual(160)
})

test("En dur. livraison colis . emballage : poids emballage * empreinte carton", () => {

    // Given
    const rules = `
        poids emballage: 4 kg
        empreinte carton: 4 CO2e
        livraison colis . emballage:
            titre: Emballage du colis
            note: Hypothèse d'un emballage carton uniquement
            formule: poids emballage * empreinte carton
    `
    const parsedRules = parse(rules)
    console.log('parsedRules2', parsedRules);
    const engine = new Engine(parsedRules)

    // When
    engine.setSituation({
        "poids emballage": '80',
        "empreinte carton": '2',
    })
    const evaluated = engine.evaluate('livraison colis . emballage')
    // Then
    expect(evaluated.nodeValue).toEqual(160)
})  

