let yaml = require('yaml')
let fs = require('fs')
let glob = require('glob')

glob('documentation/actions-plus/*.md', (err2, mdFiles) => {
	const data = mdFiles.reduce((memo, filename) => {
		const content = fs.readFileSync('./' + filename, 'utf8')
		const dottedName = filename.replace(
			/(documentation\/actions-plus\/|\.md)/g,
			''
		)

		return { ...memo, [dottedName]: content }
	}, {})

	fs.writeFile(
		'./public/actions-plus.json',
		JSON.stringify(data),
		function (err) {
			if (err) return console.error(err)
			console.log(
				'Les actions plus en JSON ont été écrites avec succès, bravo !'
			)
		}
	)
})

glob('documentation/guide-mode-groupe/*.md', (err2, mdFiles) => {
	const data = mdFiles.reduce((memo, filename) => {
		const content = fs.readFileSync('./' + filename, 'utf8')
		const guideName = filename.replace(
			/(documentation\/guide-mode-groupe\/|\.md)/g,
			''
		)
		return {
			...memo,
			[guideName]: content,
		}
	}, {})

	fs.writeFile(
		'./public/guide-mode-groupe.json',
		JSON.stringify(data),
		function (err) {
			if (err) return console.error(err)
			console.log(
				'Les guides mode groupe en JSON ont été écrites avec succès, bravo !'
			)
		}
	)
})
