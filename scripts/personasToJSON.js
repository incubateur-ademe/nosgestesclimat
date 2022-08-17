let yaml = require('yaml')
let fs = require('fs')

const personasYaml = 'data/personas.yaml'
const data = fs.readFileSync('./' + personasYaml, 'utf8')
const personas = yaml.parse(data)

fs.writeFile(
	'./public/personas.json',
	JSON.stringify(personas),
	function (err) {
		if (err) return console.error(err)
		console.log('Le fichier personas.yaml a été converti avec succès !')
	}
)
