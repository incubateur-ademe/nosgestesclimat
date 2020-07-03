let yaml = require('yaml')
let fs = require('fs')

fs.readdir('../data/', 'utf8', (err, filenames) => {
	if (err) console.error(err)

	const rules = filenames.reduce((memo, filename) => {
		const data = fs.readFileSync('../data/' + filename, 'utf8')
		const rules = yaml.parse(data)
		return { ...memo, ...rules }
	}, {})
	fs.writeFile('./public/co2.json', JSON.stringify(rules), function (err) {
		if (err) return console.error(err)
		console.log('Les règles en JSON ont été écrites avec succès, bravo !')
	})
})
