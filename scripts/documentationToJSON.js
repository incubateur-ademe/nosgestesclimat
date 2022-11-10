let fs = require('fs')
let glob = require('glob')
const yargs = require('yargs')

const markdown = yargs
	.option('markdown', {
		alias: 'm',
		type: 'boolean',
		description: `Prints the result in a Markdown table.`,
	})
	.help()
	.alias('help', 'h').argv.markdown

glob('documentation/*/*.md', (_err2, mdFiles) => {
	const data = mdFiles.reduce((memo, filename) => {
		const content = fs.readFileSync('./' + filename, 'utf8')
		const dottedName = filename.replace(/(documentation\/|\.md)/g, '')

		return { ...memo, [dottedName]: content }
	}, {})

	fs.writeFile(
		'./public/documentation.json',
		JSON.stringify(data),
		function (err) {
			if (err) {
				if (markdown) {
					console.log(
						`| Documentation compilation to JSON | ❌ | <details><summary>See error:</summary><br /><br /><code>${err}</code></details> |`
					)
				} else {
					console.error(
						' ❌ An error occured while compililing documentation to JSON:'
					)
					console.error(err)
				}

				return -1
			}

			console.log(
				markdown
					? `| Documentation compilation to JSON | :heavy_check_mark: | Ø |`
					: ' ✅ Documentation compilation to JSON'
			)
		}
	)
})
