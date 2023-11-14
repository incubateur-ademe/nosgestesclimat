// Publicode rules used to be defined as a list of objects identified by the concatenation of their `espace` and `nom` attributes.
// They're now values indexed by the concatenation as a key
// See the PR that enacted this : https://github.com/betagouv/mon-entreprise/pull/719

// Usage : `cat source\règles\base.yaml | node migrate-publicode.js > newFile.yaml`

const fs = require('fs')
const file = fs.readFileSync('/dev/stdin', 'utf-8')

const rules = file.split(/\n-/)

const matchLine = { nom: '  nom:', espace: '  espace:' }

const modifiedRules = rules.map((rule) => {
  let lines = (' ' + rule).split(/\n/)
  const nomLine = lines.find((l) => l.match(matchLine.nom))

  const espaceLine = lines.find((l) => l.match(matchLine.espace))
  if (nomLine) {
    const nom = nomLine.substring(matchLine.nom.length).trim()
    const espace =
      espaceLine && espaceLine.substring(matchLine.espace.length).trim()
    const dottedName = ((espace ? espace + ' . ' : '') + nom).trim()
    lines = [
      dottedName + ':',
      ...lines.filter(
        (l) => !l.match(matchLine.nom) && !l.match(matchLine.espace),
      ),
    ]
  }
  return lines.join('\n')
})

console.log(modifiedRules.join('\n'))
