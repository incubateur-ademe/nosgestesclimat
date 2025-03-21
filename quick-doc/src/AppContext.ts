import { NGCRules } from './../../index.d'
import { Context, Dispatch, createContext } from 'react'
import Engine from 'publicodes'
import { PersonaKey, personas } from './Personas'
import ReportManager from './ReportManager'

import rules from '../../public/co2-model.FR-lang.fr.json'

export const initialEngine = new Engine(rules as NGCRules, {
  strict: {
    situation: false
  }
})

export type AppContextType = {
  engine?: typeof initialEngine
  currentPersona?: PersonaKey
  currentMetric?: 'carbone' | 'eau'
  // personas?: typeof personas
  reportManager?: ReportManager
}

export const AppContext: Context<AppContextType> = createContext({})

export type AppContextAction = {
  type: 'setEngine' | 'setCurrentPersona' | 'setCurrentMetric' | 'nothing'
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
        engine: state.engine.setSituation({
          ...personas[action.currentPersona].situation,
          métrique: `'${state.currentMetric}'`
        }),
        currentPersona: action.currentPersona
      }
    }
    case 'setCurrentMetric': {
      if (!action.currentMetric || !state.engine) {
        return state
      }
      return {
        ...state,
        engine: state.engine.setSituation(
          { métrique: `'${action.currentMetric}'` },
          { keepPreviousSituation: true }
        ),
        currentMetric: action.currentMetric
      }
    }
    default:
      return state
  }
}
