import personas from '../../public/personas-fr.json' assert { type: 'json' }
import convertTo2Tonnes from './convertTo2Tonnes.mjs'
import path from 'path'
import fs from 'fs'
import { format, resolveConfig } from 'prettier'

Object.values(personas).map((persona) => {
  persona['surveyVariables'] = convertTo2Tonnes(persona.situation)
})

resolveConfig(process.cwd()).then((prettierConfig) => {
  format(JSON.stringify(personas), {
    ...prettierConfig,
    parser: 'json'
  }).then((formattedContent) => {
    fs.writeFileSync(
      path.join(
        process.cwd(),
        'scripts/convertSituation/2Tonnes/personas.json'
      ),
      formattedContent
    )
  })
})

console.log('✅ Les personas ont été convertis avec succès !')
