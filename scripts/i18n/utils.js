require('dotenv').config()
const glob = require('glob')
const fs = require('fs')
const path = require('path')
const { format, resolveConfig } = require('prettier')
const yaml = require('yaml')

const LOCK_KEY_EXT = '.lock'
const AUTO_KEY_EXT = '.auto'
const PREVIOUS_REVIEW_KEY_EXT = '.previous_review'

const publicDir = path.resolve('public')

const t9nDir = path.resolve('data/i18n/t9n')

const availableLanguages = ['fr', 'en-us'] //, 'es', 'it'] For now, we don't want es and it to be compile (it could create compilation errors).
const defaultLang = availableLanguages[0]

const readYAML = (path) => {
	return yaml.parse(fs.readFileSync(path, 'utf-8'))
}

const writeYAML = (path, content, blockQuote = 'literal', sortMapEntries) => {
	resolveConfig(process.cwd()).then((prettierConfig) =>
		fs.writeFileSync(
			path,
			format(
				yaml.stringify(content, {
					sortMapEntries,
					aliasDuplicateObjects: false,
					blockQuote,
					lineWidth: 0,
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
				return attrsToTranslate.reduce((acc, attr) => {
					const refVal = refPersonaAttrs[attr]
					if (refVal) {
						acc.push({
							personaId: freshKey,
							attr,
							refVal,
						})
					}
					return acc
				}, [])
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

const mechanismsToTranslate = [
	'titre',
	'description',
	'question',
	'résumé',
	'note',
	'suggestions',
	'mosaique',
	'abréviation',
	'nom',
	'gentilé',
]

const getMissingRules = (srcRules, targetRules) => {
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
					mechanismsToTranslate.includes(attr) &&
					val !== '' &&
					mosaiqueIncludeSuggestions
				)
			})

			if (targetRule) {
				acc.push(
					filteredValEntries.reduce((acc, [attr, refVal]) => {
						if (refVal === null) {
							// The attribute value can be `null` for imported models (importer! mechanism), it should not be translated.
							return acc
						}
						if (mechanismsToTranslate.includes(attr)) {
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
									hasTheSameRefValue = targetRef && areEqual(targetRef, refVal)
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

const objPath = (pathAr, obj) => {
	const flatPath = pathAr.flat()
	let val = obj
	let idx = 0
	let p
	while (idx < flatPath.length) {
		if (val == null) {
			return
		}
		p = flatPath[idx]
		val = val[p]
		idx += 1
	}
	return val
}

const assoc = (prop, val, obj) => {
	return { ...obj, [prop]: val }
}

const customAssocPath = (path, val, obj) => {
	if (!Array.isArray(path)) {
		return { ...obj, [path]: val }
	}
	const flatPath = path.flat()
	if (flatPath.length === 0) {
		return val
	}
	const idx = flatPath[0]
	if (flatPath.length > 1) {
		const nextObj = Object.hasOwn(obj, idx) ? obj[idx] : {}
		val = customAssocPath(flatPath.slice(1), val, nextObj)
	}
	return assoc(idx, val, obj)
}

// Returns the list of rules that are translated in the target language but
// no longer exist in the source language.
const getNotUpToDateRuleTranslations = (srcRules, targetRules) => {
	return Object.entries(targetRules)
		.filter(([_, val]) => val !== null && val !== undefined)
		.reduce((acc, [rule, _]) => {
			if (srcRules[rule] === undefined) {
				acc.push(rule)
			}
			return acc
		}, [])
}

module.exports = {
	availableLanguages,
	defaultLang,
	dotNotationToNestedObject,
	getMissingPersonas,
	getMissingRules,
	getUiMissingTranslations,
	getNotUpToDateRuleTranslations,
	isI18nKey,
	LOCK_KEY_EXT,
	AUTO_KEY_EXT,
	PREVIOUS_REVIEW_KEY_EXT,
	nestedObjectToDotNotation,
	readYAML,
	writeYAML,
	objPath,
	assoc,
	customAssocPath,
	publicDir,
	t9nDir,
	mechanismsToTranslate,
}
