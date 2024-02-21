import { Context, Dispatch, createContext, useEffect, useReducer } from 'react'
import Engine from 'publicodes'

import rules from '../../public/co2-model.FR-lang.fr.json'
import { PersonaKey, defaultPersona, personas } from './Personas'

const initialEngine = new Engine(rules)

export type AppContextType = {
  engine?: typeof initialEngine
  currentPersona?: PersonaKey
}

export const AppContext: Context<AppContextType> = createContext({})

export type AppContextAction = {
  type: 'setEngine' | 'setCurrentPersona' | 'nothing'
} & AppContextType

export const AppDispatchContext: Context<Dispatch<AppContextAction>> =
  createContext({} as any)

export function AppContextProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [appContext, dispatch] = useReducer(appContextReducer, {
    engine: initialEngine,
    currentPersona: defaultPersona
  })

  // NOTE(@EmileRolley): this is needed to rerender the engine when the compiled rules change.
  // Could we find a better way to do this?
  useEffect(() => {
    dispatch({ type: 'setEngine', engine: initialEngine })
  }, [initialEngine])

  return (
    <AppContext.Provider value={appContext}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppContext.Provider>
  )
}

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
        engine: state.engine.setSituation(
          personas[action.currentPersona].situation
        ),
        currentPersona: action.currentPersona
      }
    }
    default:
      return state
  }
}
