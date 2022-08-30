let fs = require('fs')
let glob = require('glob')

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
			if (err) return console.error(err)
			console.log(
				' ✅ Les fichiers .md de documentation/ en ont été exposées dans public/ en JSON avec succès, bravo !'
			)
		}
	)
})
