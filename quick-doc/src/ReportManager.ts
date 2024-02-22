import { Dispatch, SetStateAction } from 'react'
import axios from 'axios'
import { PersonaKey } from './Personas'

/**
 * Manages the requests for the reports of the personas with a cache.
 *
 * TODO:
 * - The cache could be stored in the local storage to persist it between sessions.
 */
export default class ReportManager {
  private cache: Map<PersonaKey, string> = new Map()

  public setPersonasReportsPage(
    persona: PersonaKey | undefined,
    setReport: Dispatch<SetStateAction<string | null>>,
    force?: boolean
  ): void {
    console.log('setPersonasReportsPage', persona, setReport, force)
    if (persona) {
      if (!force && this.cache.has(persona)) {
        console.log(`[ReportManager] cache hit for ${persona}`)
        setReport(this.cache.get(persona)!)
      } else {
        console.log(
          `[ReportManager] fetching report for ${persona} from the server`
        )
        axios.get(`http://localhost:4000/${persona}`).then((response) => {
          this.cache.set(persona, response.data)
          setReport(response.data)
        })
      }
    }
  }
}
