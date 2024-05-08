import personas from '@incubateur-ademe/nosgestesclimat/public/personas-fr.json' assert { type: 'json' }
import convertTo2Tonnes from './convertTo2Tonnes.mjs'
import path from 'path'
import fs from 'fs'

Object.entries(personas).map(([_, persona]) => {
  persona['surveyVariables'] = convertTo2Tonnes(persona.situation)
})

fs.writeFileSync(
  path.join('./2Tonnes', 'personas.json'),
  JSON.stringify(personas)
)
