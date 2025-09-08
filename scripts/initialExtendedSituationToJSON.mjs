/*
Here is a script that will create 
For now, this script only publish funFact rules used in organisation dashboard.
It should contains tests on the content : if a rule is not found, it should raise en error...
It could be extended to publish more rules used in the UI.
*/

import fs from 'fs'
import path from 'path'
import generateExtendedSituationDottedNames from './situation/generateExtendedSituationDottedNames.mjs'
import { getLocalRules, getArgs } from '../tests/commons.mjs'

const { country, language, markdown } = getArgs()
const localRules = await getLocalRules(country, language)

const extendedSituationOutputJSONPath = path.join(
  './public',
  `initialExtendedSituation.json`
)

const questionDottedNameList = generateExtendedSituationDottedNames(localRules)

function writeExtendedSituationDottedNames(
  outputJSONPath,
  questionDottedNameList
) {
  const initialExtendedSituation = questionDottedNameList.reduce(
    (acc, dottedName) => {
      acc[dottedName] = {
        source: 'omitted'
      }
      return acc
    },
    {}
  )

  fs.writeFile(
    outputJSONPath,
    JSON.stringify(initialExtendedSituation),
    function (err) {
      if (err) {
        console.error(
          ` ❌ An error occured while compililing initial extended situation to JSON`
        )
        console.error(err)

        return -1
      }

      console.log('✅ Initial Extended Situation written')
    }
  )
}

writeExtendedSituationDottedNames(
  extendedSituationOutputJSONPath,
  questionDottedNameList
)
