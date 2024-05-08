import personas from '@incubateur-ademe/nosgestesclimat/public/personas-fr.json' assert { type: 'json' }
import convertTo2Tonnes from './convertTo2Tonnes.mjs'
import path from 'path'
import fs from 'fs'
import { format, resolveConfig } from 'prettier'

Object.entries(personas).map(([_, persona]) => {
  persona['surveyVariables'] = convertTo2Tonnes(persona.situation)
})

resolveConfig(process.cwd()).then((prettierConfig) => {
  format(JSON.stringify(personas), {
    ...prettierConfig,
    parser: 'json'
  }).then((formattedContent) => {
    fs.writeFileSync(path.join('./2Tonnes', 'personas.json'), formattedContent)
  })
})
