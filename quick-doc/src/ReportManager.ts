import axios from 'axios'
import { PersonaKey } from './Personas'
import { Version } from './Versions'

type MapKey = string

function mapKey(persona: PersonaKey, version: Version): MapKey {
  return `${persona}-${version}`
}

/**
 * Manages the requests for the reports of the personas with a cache.
 *
 * TODO:
 * - Manage the errors of the requests.
 * - The cache could be stored in the local storage to persist it between sessions.
 */
export default class ReportManager {
  private cache: Map<MapKey, string> = new Map()

  public fetchReport(
    persona: PersonaKey | undefined,
    version: Version,
    setReport: (report: string, cacheHit: boolean) => void,
    onError: (error: string) => void,
    force?: boolean
  ): void {
    if (persona) {
      const key = mapKey(persona, version)

      if (!force && this.cache.has(key)) {
        console.log(`[ReportManager] cache hit for ${persona} (${version})`)
        setReport(this.cache.get(key)!, true)
      } else {
        const url = `http://localhost:4000/${version}/${persona}`

        console.log(`[ReportManager] fetching: ${url}`)
        axios
          .get(`http://localhost:4000/${version}/${persona}`)
          .then((response) => {
            this.cache.set(key, response.data)
            setReport(response.data, false)
          })
          .catch((error: Error) => {
            console.log(
              `[ReportManager] error fetching: ${url}: ${error.message}`
            )
            onError(error.message)
          })
      }
    }
  }
}
