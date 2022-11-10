const deepl = require('deepl-node')

const translator = new deepl.Translator(process.env.DEEPL_API_KEY)

const glossaryEntries = new deepl.GlossaryEntries({
	entries: { 'Nos Gestes Climat': 'Nos Gestes Climat' },
})

const main = async () => {
	const glossaryFRToEN = await translator.createGlossary(
		'Nos Gestes Climat glossary',
		'fr',
		'en-US',
		glossaryEntries
	)
	console.log('Available glossaries:', await translator.listGlossaries())
}

main()
