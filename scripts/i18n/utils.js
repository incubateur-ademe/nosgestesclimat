require('dotenv').config()
const fs = require('fs')
const { format, resolveConfig } = require('prettier')
const R = require('ramda')
const yaml = require('yaml')

const LOCK_KEY_EXT = '.lock'

const availableLanguages = ['fr', 'en-us'] //, 'es', 'it'] For now, we don't want es and it to be compile (it could create compilation errors).
const defaultLang = availableLanguages[0]

const supportedModels = ['FR', 'CH']

const readYAML = (path) => {
	return yaml.parse(fs.readFileSync(path, 'utf-8'))
}

const writeYAML = (path, content, blockQuote = 'literal') => {
	resolveConfig(process.cwd()).then((prettierConfig) =>
		fs.writeFileSync(
			path,
			format(
				yaml.stringify(content, {
					sortMapEntries: true,
					blockQuote,
				}),
				{ ...prettierConfig, parser: 'yaml' }
			)
		)
	)
}

const isI18nKey = (key) => {
	return null !== key.match(/(?<=[A-zÀ-ü0-9])\.(?=[A-zÀ-ü0-9])/)
}

const getUiMissingTranslations = (sourcePath, targetPath, override = false) => {
	if (!fs.existsSync(targetPath) || override) {
		console.log(`Creating ${targetPath}`)
		fs.writeFileSync(targetPath, '{}')
	}

	const freshEntries = readYAML(sourcePath).entries
	const translatedEntries = readYAML(targetPath).entries

	const missingTranslations = Object.entries(freshEntries).filter(
		([freshKey, refVal]) => {
			if (freshKey.match(/^\{.*\}$/)) {
				// Skip keys of the form '{<str>}' as they are not meant to be translated
				return false
			}
			return (
				// missing translation
				!translatedEntries[freshKey] ||
				// reference value updated
				(isI18nKey(freshKey) &&
					refVal !== translatedEntries[freshKey + LOCK_KEY_EXT])
			)
		}
	)

	return missingTranslations
}

// Source: https://www.thiscodeworks.com/convert-javascript-dot-notation-object-to-nested-object-javascript/60e47841a2dbdc00144e9446
const dotNotationToNestedObject = (obj) => {
	const result = {}

	for (const objectPath in obj) {
		const parts = objectPath.split('.')

		let target = result
		while (parts.length > 1) {
			const part = parts.shift()
			target = target[part] = target[part] || {}
		}

		target[parts[0]] = obj[objectPath]
	}

	return result
}

// TODO: could be optimized?
const nestedObjectToDotNotation = (obj) => {
	const result = {}

	const flatten = (prefix, obj) => {
		for (const key in obj) {
			const value = obj[key]
			const newKey = prefix ? prefix + '.' + key : key

			if (typeof value === 'object') {
				flatten(newKey, value)
			} else {
				result[newKey] = value
			}
		}
	}

	flatten('', obj)

	return result
}

const getMissingPersonas = (refPersonas, destPersonas, force = false) => {
	const attrsToTranslate = ['nom', 'description', 'résumé']
	const isAttrToTranslate = ([key, _]) => attrsToTranslate.includes(key)
	const missingTranslations = Object.entries(refPersonas).flatMap(
		([freshKey, refPersonaAttrs]) => {
			const destPersona = destPersonas[freshKey]

			if (!destPersona) {
				return attrsToTranslate.map((attr) => {
					const refVal = refPersonaAttrs[attr]
					return refVal
						? {
								personaId: freshKey,
								attr,
								refVal,
						  }
						: {}
				})
			}
			return Object.entries(refPersonaAttrs)
				.filter(isAttrToTranslate)
				.reduce((acc, [attr, refVal]) => {
					const destVal = destPersona[attr]
					if (
						!destVal ||
						destPersona[attr + LOCK_KEY_EXT] !== refVal ||
						force
					) {
						acc.push({ personaId: freshKey, attr, refVal })
					}
					return acc
				}, [])
		}
	)
	return missingTranslations
}

const getMissingRules = (srcRules, targetRules) => {
	const keysToTranslate = [
		'titre',
		'description',
		'question',
		'résumé',
		'note',
		'suggestions',
		'mosaique',
		'abréviation',
	]

	const areEqual = (s1, s2) => {
		return (
			JSON.stringify(s1, { sortMapEntries: true }) ===
			JSON.stringify(s2, { sortMapEntries: true })
		)
	}

	return Object.entries(srcRules)
		.filter(([_, val]) => val !== null && val !== undefined)
		.reduce((acc, [rule, val]) => {
			let targetRule = targetRules[rule]
			const valEntries = Object.entries(val)

			if (!valEntries.map(([key, _]) => key).includes('titre')) {
				// Adds a default title if missing.
				const splitedRule = rule.split(' . ')
				valEntries.push(['titre', splitedRule[splitedRule.length - 1]])
			}

			const filteredValEntries = valEntries.filter(([attr, val]) => {
				const mosaiqueIncludeSuggestions =
					// φ => ψ === ¬φ ∨ ψ
					'mosaique' !== attr || val.suggestions
				return (
					keysToTranslate.includes(attr) &&
					val !== '' &&
					mosaiqueIncludeSuggestions
				)
			})

			if (targetRule) {
				acc.push(
					filteredValEntries.reduce((acc, [attr, refVal]) => {
						if (keysToTranslate.includes(attr)) {
							let targetRef = targetRule[attr + LOCK_KEY_EXT]
							let hasTheSameRefValue

							switch (attr) {
								case 'suggestions': {
									refVal = Object.keys(refVal)
									hasTheSameRefValue = targetRef && areEqual(targetRef, refVal)
									break
								}
								case 'mosaique': {
									targetRef = targetRule[attr]?.['suggestions' + LOCK_KEY_EXT]
									refVal = Object.keys(refVal.suggestions)
									hasTheSameRefValue =
										targetRef &&
										areEqual(targetRef.suggestions, refVal.suggestions)
									break
								}
								default:
									hasTheSameRefValue =
										targetRef &&
										// NOTE: avoid false positive caused by non trimmed white spaces.
										targetRef.replaceAll(' ', '') === refVal.replaceAll(' ', '')
									break
							}

							if (hasTheSameRefValue && targetRule[attr]) {
								// The rule is already translated.
								return acc
							}
							acc.push({ rule, attr, refVal })
						}
						return acc
					}, [])
				)
			} else {
				// The rule doesn't exist in the target, so all attributes need to be translated.
				acc.push(
					filteredValEntries.map(([attr, refVal]) => {
						switch (attr) {
							case 'suggestions':
								return { rule, attr, refVal: Object.keys(refVal) }
							case 'mosaique':
								return { rule, attr, refVal: Object.keys(refVal.suggestions) }
							default:
								return { rule, attr, refVal }
						}
					})
				)
			}
			return acc
		}, [])
		.flat()
}

module.exports = {
	availableLanguages,
	defaultLang,
	supportedModels,
	dotNotationToNestedObject,
	getMissingPersonas,
	getMissingRules,
	getUiMissingTranslations,
	isI18nKey,
	LOCK_KEY_EXT,
	nestedObjectToDotNotation,
	readYAML,
	writeYAML,
}
