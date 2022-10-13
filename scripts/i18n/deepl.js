require('isomorphic-fetch')
const deepl = require('deepl-node')
const nodePandoc = require('node-pandoc-promise')

const NO_TRANS_CHAR = ' '

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

module.exports = {
	fetchTranslation,
	fetchTranslationMarkdown,
}
