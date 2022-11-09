let yaml = require('yaml')
let fs = require('fs')
let glob = require('glob')
let path = require('path')
const { exit } = require('process')
const Engine = require('publicodes').default

const cli = require('./cli')

const { srcFolder, destFile, rulesToEvaluate } = cli.getArgs(
	`Convert rules to JSON in public folder`
)

const outputJSONFileName = `./public/${destFile}.json`

const commonFile = './data/utils.yaml'

glob(`./data/${srcFolder}/*.yaml`, (_, files) => {
	if (!files.includes(commonFile)) {
		files.push(commonFile)
	}
	const rules = files.reduce((memo, filename) => {
		try {
			const data = fs.readFileSync('./' + filename, 'utf8')
			const rules = yaml.parse(data)
			const splitName = filename
				.replace(`${path.dirname(filename)}/`, '')
				.split('>.yaml')
			const prefixedRuleSet =
				splitName.length > 1
					? Object.fromEntries(
							Object.entries(rules).map(([k, v]) => [
								k === 'index' ? splitName[0] : splitName[0] + ' . ' + k,
								v,
							])
					  )
					: rules
			return { ...memo, ...prefixedRuleSet }
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
		const engine = new Engine(rules)
		rulesToEvaluate.split(',').map((rule) => {
			engine.evaluate(rule)
			console.log(` ✅ La règle ${rule} a été évaluée sans erreur !`)
		})
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
