let yaml = require('yaml')
const yargs = require('yargs')
let fs = require('fs')

const personasYaml = 'personas.yaml'
const data = fs.readFileSync('./' + personasYaml, 'utf8')
const personas = yaml.parse(data)
const markdown = yargs
	.option('markdown', {
		alias: 'm',
		type: 'boolean',
		description: `Prints the result in a Markdown table.`,
	})
	.help()
	.alias('help', 'h').argv.markdown

fs.writeFile(
	'./public/personas.json',
	JSON.stringify(personas),
	function (err) {
		if (err) {
			if (markdown) {
				console.log(
					`| Personas compilation to JSON | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
				)
			} else {
				console.error(
					' ❌ An error occured while compililing personas to JSON:'
				)
				console.error(err)
			}

			return -1
		}
		console.log(
			markdown
				? `| Personas compilation to JSON | :heavy_check_mark: | Ø |`
				: ' ✅ Personas compilation to JSON'
		)
	}
)
