let yaml = require('yaml')
let fs = require('fs')
let glob = require('glob')

glob('data/**/*.yaml', (err, files) => {
	const rules = files.reduce((memo, filename) => {
		const data = fs.readFileSync('./' + filename, 'utf8')
		const rules = yaml.parse(data)
		return { ...memo, ...rules }
	}, {})

	fs.writeFile('./public/co2.json', JSON.stringify(rules), function (err) {
		if (err) return console.error(err)
		console.log('Les règles en JSON ont été écrites avec succès, bravo !')
	})
})
