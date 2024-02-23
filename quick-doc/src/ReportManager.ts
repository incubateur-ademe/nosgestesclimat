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
 * - The cache could be stored in the local storage to persist it between sessions.
 */
export default class ReportManager {
  private cache: Map<MapKey, string> = new Map()

  public getCachedReport(
    persona: PersonaKey | undefined,
    version: Version
  ): string | undefined {
    if (!persona) {
      return undefined
    }

    const key = mapKey(persona, version)

    return this.cache.get(key)
  }

  public fetchReport(
    persona: PersonaKey | undefined,
    version: Version,
    setReport: (report: string, cacheHit: boolean) => void,
    setTimeElapsed: (timeElapsed: number) => void,
    onError: (error: string) => void,
    force?: boolean
  ): void {
    if (persona) {
      const key = mapKey(persona, version)

      if (!force && this.cache.has(key)) {
        console.log(`[ReportManager] cache hit for ${persona} (${version})`)
        setReport(this.cache.get(key)!, true)
      } else {
        const url = `http://localhost:4000/testPersonas/${version}/${persona}`

        console.log(`[ReportManager] fetching: ${url}`)
        axios
          .get(`http://localhost:4000/testPersonas/${version}/${persona}`)
          .then((response) => {
            console.log(`[ReportManager] response:`, response.data)
            this.cache.set(key, response.data.report)
            setReport(response.data.report, false)
            setTimeElapsed(response.data.timeElapsed)
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
