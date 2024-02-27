import { Context, Dispatch, createContext } from 'react'
import Engine from 'publicodes'
import { PersonaKey, personas } from './Personas'
import ReportManager from './ReportManager'

// @ts-ignore
import safeGetSituation from './../../tests/helpers/safeGetSituation.mjs'

import rules from '../../public/co2-model.FR-lang.fr.json'

export const initialEngine = new Engine(rules)

export type AppContextType = {
  engine?: typeof initialEngine
  currentPersona?: PersonaKey
  // personas?: typeof personas
  reportManager?: ReportManager
}

export const AppContext: Context<AppContextType> = createContext({})

export type AppContextAction = {
  type: 'setEngine' | 'setCurrentPersona' | 'nothing'
} & AppContextType

export const AppDispatchContext: Context<Dispatch<AppContextAction>> =
  createContext({} as any)

export function appContextReducer(
  state: AppContextType,
  action: AppContextAction
) {
  switch (action.type) {
    case 'setEngine':
      return { ...state, engine: action.engine }
    case 'setCurrentPersona': {
      if (!action.currentPersona || !state.engine) {
        return state
      }
      return {
        ...state,
        engine: state.engine.setSituation(
          safeGetSituation({
            situation: personas[action.currentPersona].situation,
            parsedRulesNames: Object.keys(state.engine.getParsedRules()),
            version: 'locale'
          })
        ),
        currentPersona: action.currentPersona
      }
    }
    default:
      return state
  }
}
