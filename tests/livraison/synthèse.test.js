import { testOf } from './utils'

const testScenario = (publiProp, descr, inputs, output) => {
	testOf('data/livraison/*.yaml', publiProp, descr, inputs, output)
}

testScenario(
	'livraison colis . scénario . scénario 1 synthèse',
	'Le résultat du scénario 1 de la synthèse doit être 541.166134880806 gCO2e',
	{},
	541.166134880806
)
