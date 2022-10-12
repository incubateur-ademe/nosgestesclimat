require('dotenv').config()
require('isomorphic-fetch')
const fs = require('fs')
const R = require('ramda')
const yaml = require('yaml')
const deepl = require('deepl-node')
const nodePandoc = require('node-pandoc-promise')

const NO_TRANS_CHAR = ' '
const LOCK_KEY_EXT = '.lock'

const availableLanguages = ['fr', 'en-us', 'es', 'it']
const defaultLang = availableLanguages[0]

const readYAML = (path) => {
	return yaml.parse(fs.readFileSync(path, 'utf-8'))
}

const writeYAML = (path, content) => {
	fs.writeFileSync(
		path,
		yaml.stringify(content, {
			sortMapEntries: true,
			blockQuote: 'folded',
		})
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

	const missingTranslations = Object.entries(freshEntries)
		.filter(([freshKey, refVal]) => {
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
		})
		.map(([key, _]) => key)
	return R.pick(missingTranslations, freshEntries)
}

const translator = new deepl.Translator(process.env.DEEPL_API_KEY)

const markdownToHtml = async (srcMd) => {
	const srcHtml = await nodePandoc(srcMd, [
		'-f',
		'markdown_strict',
		'-t',
		'html',
	])
	return srcHtml
}

const htmlToMarkdown = async (srcHtml) => {
	const srcMd = await nodePandoc(srcHtml, [
		'-f',
		'html',
		'-t',
		'markdown_strict',
		'--atx-headers',
	])
	return srcMd
}

const fetchTranslationMarkdown = async (srcMd, sourceLang, targetLang) => {
	const getSrcHtml = async () => {
		if (srcMd instanceof Array) {
			const srcHtml = []
			await Promise.all(
				srcMd.map(async (src) => {
					srcHtml.push(await markdownToHtml(src))
				})
			)
			return srcHtml
		} else {
			return await markdownToHtml(srcMd)
		}
	}

	const srcHtml = await getSrcHtml()
	const htmlTrans = await fetchTranslation(
		srcHtml,
		sourceLang,
		targetLang,
		'html'
	)

	if (htmlTrans instanceof Array) {
		let res = []
		await Promise.all(
			htmlTrans.map(async (src) => {
				res.push(await htmlToMarkdown(src))
			})
		)
		return res
	}
	const res = await htmlToMarkdown(htmlTrans)

	return res
}

const fetchTranslation = async (
	text,
	sourceLang,
	targetLang,
	tagHandling = 'xml'
) => {
	if (process.env.TEST_MODE) {
		const tradOrEmpty = (t) =>
			t === NO_TRANS_CHAR ? NO_TRANS_CHAR : '[TRAD] ' + t
		return text instanceof Array ? text.map(tradOrEmpty) : tradOrEmpty(text)
	}
	const resp = await translator.translateText(text, sourceLang, targetLang, {
		tagHandling,
		ignoreTags: ['a', 'ignore'],
		preserveFormatting: true,
	})

	return resp instanceof Array
		? resp.map((translation) => translation.text)
		: resp.text
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

module.exports = {
	fetchTranslation,
	fetchTranslationMarkdown,
	getUiMissingTranslations,
	dotNotationToNestedObject,
	nestedObjectToDotNotation,
	defaultLang,
	availableLanguages,
	isI18nKey,
	LOCK_KEY_EXT,
	readYAML,
	writeYAML,
}
