import axios from 'axios'
import { NGCRules } from './../../../index.d'
import { getPRNumberFromURL } from './getPRNumberFromURL'

export async function getRules(): Promise<Partial<NGCRules> | null> {
  const PRNumber = getPRNumberFromURL() ?? 'nightly'

  const fileName = 'co2-model.FR-lang.fr.json'
  const previewURL = `https://nosgestesclimat-dev.s3.fr-par.scw.cloud/model/${PRNumber}`

  console.log('fetching preview file', { fileName, PRNumber })

  return axios
    .get(`${previewURL}/${fileName}`)
    .then((res) => res.data)
    .catch((e) => {
      console.error('Error fetching preview file', {
        fileName,
        PRNumber,
        error: e
      })
      return null
    })
}
