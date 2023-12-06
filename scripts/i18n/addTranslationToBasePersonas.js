/*
	Function used to combine translated attributes (e.g. résumé, description and nom) with
	the base personas.

	NOTE: this function is used by the file Personas.tsx of the website.
*/

const utils = require('@incubateur-ademe/nosgestesclimat-scripts/utils')

const addTranslationToBasePersonas = (basePersonas, translatedPersonas) => {
  var resPersonas = basePersonas

  Object.entries(translatedPersonas).forEach(([personaId, attrs]) => {
    Object.entries(attrs)
      .filter(([attr, _]) => !attr.endsWith(utils.LOCK_KEY_EXT))
      .forEach(([attr, transVal]) => {
        const key = [personaId, attr]
        if (utils.objPath(key, basePersonas)) {
          // TODO: automatically remove from translated file entries which aren't anymore in the ref personas.
          resPersonas = utils.customAssocPath(key, transVal, resPersonas)
        }
      })
  })

  return resPersonas
}

module.exports = {
  addTranslationToBasePersonas
}
