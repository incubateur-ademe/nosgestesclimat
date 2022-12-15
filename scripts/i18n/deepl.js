require('isomorphic-fetch')
const deepl = require('deepl-node')
const { marked } = require('marked')
const { NodeHtmlMarkdown } = require('node-html-markdown')

const NO_TRANS_CHAR = ' '

const translator = new deepl.Translator(process.env.DEEPL_API_KEY)

const markdownToHtml = (md) => {
	return marked.parse(md.replace(/^[\u200B\u200C\u200D\u200E\u200F\uFEFF]/, ''))
}

const nhm = new NodeHtmlMarkdown({})

// Translates a markdown string to HTML, before translating it to the target language
// and finally converting it back to markdown.
const fetchTranslationMarkdown = async (srcMd, sourceLang, targetLang) => {
	const isAnArray = srcMd instanceof Array
	const escapedMd = isAnArray
		? srcMd.map(markdownToHtml)
		: markdownToHtml(srcMd)

	var trans = await fetchTranslation(escapedMd, sourceLang, targetLang, 'html')
	return isAnArray ? trans.map(nhm.translate) : nhm.translate(trans)
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

	const glossary =
		targetLang === 'en-us'
			? await translator.getGlossary('bfe1506b-b7e6-49c6-90f2-bcd4488ab270')
			: undefined

	const resp = await translator.translateText(text, sourceLang, targetLang, {
		ignoreTags: ['ignore'],
		preserveFormatting: true,
		glossary,
		tagHandling,
	})
	// here we replace html special character &amp; to & but it should be done for all characters.
	return resp instanceof Array
		? resp.map((translation) => translation.text.replaceAll('&amp;', '&'))
		: resp.text.replaceAll('&amp;', '&')
}

module.exports = {
	fetchTranslation,
	fetchTranslationMarkdown,
}
