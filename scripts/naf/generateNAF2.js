const fs = require('fs')

const nafFileName = 'data/NAF/liste_NAF.json'
const readNAF = fs.readFileSync(nafFileName, 'utf8')
const NAF_level2 = JSON.parse(readNAF).reduce((memo, elt) => {
	const lastId = memo.length > 0 && memo[memo.length - 1].code_NAF
	const currentId = elt.id_1 + elt.id_2
	if (lastId !== currentId) {
		memo.push({
			code_NAF: currentId,
			libellé: elt.label_2,
		})
	}
	return memo
}, [])

// fs.writeFileSync('data/NAF/liste_NAF_level2.json', JSON.stringify(NAF_level2))
