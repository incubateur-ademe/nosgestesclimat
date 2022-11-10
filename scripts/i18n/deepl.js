require('isomorphic-fetch')
const deepl = require('deepl-node')

const NO_TRANS_CHAR = ' '

const translator = new deepl.Translator(process.env.DEEPL_API_KEY)

const simpleLinkRe = new RegExp(/[^!]\[(?<txt>.*?)\]\((?<url>.*?)\)/g)
const imgInsideLinkRe = new RegExp(/\[(?<txt>!.*?\]\(.*?\))\]\((?<url>.*?)\)/g)

const escapeMarkdownLinks = (str) => {
	const escape = (re, str, isImbricatedImgLink = false) => {
		const elements = str.matchAll(re)
		if (elements) {
			for (el of elements) {
				let matchedStr = el[0].trim()
				if (isImbricatedImgLink || !matchedStr.startsWith('[!')) {
					str = str.replace(
						matchedStr,
						`<a href="${el.groups.url}">${el.groups.txt}</a>`
					)
				}
			}
		}
		return str
	}

	str = escape(simpleLinkRe, str)
	str = escape(imgInsideLinkRe, str, true)
	return str
}

const fetchTranslationMarkdown = async (srcMd, sourceLang, targetLang) => {
	const escapedMd =
		srcMd instanceof Array
			? srcMd.map(escapeMarkdownLinks)
			: escapeMarkdownLinks(srcMd)

	const trans = await fetchTranslation(escapedMd, sourceLang, targetLang)

	return trans
}

const fetchTranslation = async (text, sourceLang, targetLang) => {
	if (process.env.TEST_MODE) {
		const tradOrEmpty = (t) =>
			t === NO_TRANS_CHAR ? NO_TRANS_CHAR : '[TRAD] ' + t
		return text instanceof Array ? text.map(tradOrEmpty) : tradOrEmpty(text)
	}
	const glossary = await translator.getGlossary(
		'bfe1506b-b7e6-49c6-90f2-bcd4488ab270'
	)
	const resp = await translator.translateText(text, sourceLang, targetLang, {
		ignoreTags: ['a', 'ignore'],
		preserveFormatting: true,
		glossary,
	})

	return resp instanceof Array
		? resp.map((translation) => translation.text)
		: resp.text
}

module.exports = {
	fetchTranslation,
	fetchTranslationMarkdown,
}
