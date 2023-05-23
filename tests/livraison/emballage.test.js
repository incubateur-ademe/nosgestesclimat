import Engine from 'publicodes'
import { parse } from 'yaml'


test("livraison colis . emballage : poids emballage * empreinte carton", () => {
    
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

