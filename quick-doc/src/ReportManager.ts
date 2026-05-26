import { PersonaKey } from './Personas'
import { Version, Metric } from './Versions'

type MapKey = string

function mapKey(persona: PersonaKey, version: Version, metric: Metric): MapKey {
  return `${persona}-${version}-${metric}`
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
    version: Version,
    metric: Metric
  ): string | undefined {
    if (!persona) {
      return undefined
    }

    const key = mapKey(persona, version, metric)

    return this.cache.get(key)
  }

  public fetchReport(
    persona: PersonaKey | undefined,
    version: Version,
    metric: Metric,
    setReport: (report: string, cacheHit: boolean) => void,
    setTimeElapsed: (timeElapsed: number) => void,
    onError: (error: string) => void,
    force?: boolean
  ): void {
    if (persona) {
      const key = mapKey(persona, version, metric)

      if (!force && this.cache.has(key)) {
        console.log(`[ReportManager] cache hit for ${persona} (${version})`)
        setReport(this.cache.get(key)!, true)
      } else {
        const url = `http://localhost:4000/testPersonas/${version}/${metric}/${persona}`

        console.log(`[ReportManager] fetching: ${url}`)
        fetch(url)
          .then(async (response) => {
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`)
            }

            return (await response.json()) as {
              report: string
              timeElapsed: number
            }
          })
          .then((data) => {
            console.log(`[ReportManager] response:`, data)
            this.cache.set(key, data.report)
            setReport(data.report, false)
            setTimeElapsed(data.timeElapsed)
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
