import Engine from 'publicodes'
import { parse } from 'yaml'


test("livraison colis . emballage : poids emballage * empreinte carton", () => {
    
    const rules = `
poids emballage: 4 kg
empreinte carton: 4 CO2e
livraison colis . emballage:
  titre: Emballage du colis
  note: Hypothèse d'un emballage carton uniquement
  formule: poids emballage * empreinte carton
    `

    // // publicodes ne prend plus en entrée du YAML, vous devez parser vous-même votre code source
    const parsedRules = parse(rules)

    // // On initialise un moteur en lui donnant le publicodes sous forme d'objet javascript.
    // // Ce publicodes va être parsé
    const engine = new Engine(parsedRules)

    engine.setSituation({
        "poids emballage": '80',
        "empreinte carton": '2',
    })
    const evaluated = engine.evaluate('livraison colis . emballage')
    // // teste la valeur brute
    expect(evaluated.nodeValue).toEqual(160)
})  

