import { NGCRules } from './../../../index.d'
import { getPRNumberFromURL } from './getPRNumberFromURL'

export async function getRules(): Promise<Partial<NGCRules> | null> {
  const PRNumber = getPRNumberFromURL() ?? 'nightly'

  const fileName = 'co2-model.FR-lang.fr.json'
  const previewURL = `https://nosgestesclimat-dev.s3.fr-par.scw.cloud/model/${PRNumber}`

  console.log('fetching preview file', { fileName, PRNumber })

  try {
    const response = await fetch(`${previewURL}/${fileName}`)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    return (await response.json()) as Partial<NGCRules>
  } catch (error) {
    console.error('Error fetching preview file', {
      fileName,
      PRNumber,
      error
    })
    return null
  }
}
