let yaml = require('yaml')
let fs = require('fs')
let glob = require('glob')
const { exit } = require('process')
const Engine = require('publicodes').default

const outputJSONFileName = './public/co2.json'

// this file is kindof a duplicate of RulesProvider (which serves for the local watched webpack environment) in ecolab-climat
// if it grows more than 20 lines, it should be shared

glob('data/**/*.yaml', (_, files) => {
	const rules = files.reduce((memo, filename) => {
		try {
			const data = fs.readFileSync('./' + filename, 'utf8')
			if (!filename.includes('bilan')) return memo
			const rules = yaml.parse(data)
			return { ...memo, ...rules }
		} catch (err) {
			console.log(
				' ❌ Une erreur est survenue lors de la lecture du fichier',
				filename,
				':\n\n',
				err.message
			)
			exit(-1)
		}
	}, {})

	try {
		new Engine(rules).evaluate('bilan')
		console.log(' ✅ Les règles ont été évaluées sans erreur !')
		fs.writeFile(outputJSONFileName, JSON.stringify(rules), function (err) {
			if (err) return console.error(err)
			console.log(
				' ✅ Les règles en JSON ont été écrites avec succès dans le fichier:',
				outputJSONFileName
			)
		})
	} catch (err) {
		console.log(
			' ❌ Une erreur est survenue lors de la traduction des règles:\n'
		)
		let lines = err.message.split('\n')
		for (let i = 0; i < 9; ++i) {
			if (lines[i]) {
				console.log('  ', lines[i])
			}
		}
		console.log()
	}
})
