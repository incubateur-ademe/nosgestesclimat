/*
	Function used to combine translated attributes (e.g. résumé, description and nom) with
	the base personas.

	NOTE: this function is used by the file Personas.tsx of the website.
*/

const R = require('ramda')

const addTranslationToBasePersonas = (basePersonas, translatedPersonas) => {
	var resPersonas = basePersonas

	Object.entries(translatedPersonas).forEach(([personaId, attrs]) => {
		Object.entries(attrs)
			.filter(([attr, _]) => !attr.endsWith('.lock'))
			.forEach(([attr, transVal]) => {
				resPersonas = R.assocPath([personaId, attr], transVal, resPersonas)
			})
	})

	return resPersonas
}

module.exports = {
	addTranslationToBasePersonas,
}
