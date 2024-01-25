import base from './public/co2-model.FR-lang.fr.json'
import opti from './public/co2-model.FR-lang.fr-opti.json'
import Engine from 'publicodes'

const baseEngine = new Engine(base)
const optiEngine = new Engine(opti, { allowOrphanRules: true })

console.log(baseEngine.evaluate('alimentation . déchets . composter').nodeValue)
console.log(optiEngine.evaluate('alimentation . déchets . composter').nodeValue)
