import { useEffect, useReducer } from 'react'
import { defaultPersona, personas } from './Personas'
import ReportManager from './ReportManager'
import {
  AppContext,
  AppDispatchContext,
  appContextReducer,
  initialEngine
} from './AppContext'

export default function AppContextProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [appContext, dispatch] = useReducer(appContextReducer, {
    engine: initialEngine,
    currentPersona: defaultPersona,
    reportManager: new ReportManager()
  })

  // NOTE(@EmileRolley): this is needed to rerender the engine when the compiled rules change.
  // Could we find a better way to do this?
  useEffect(() => {
    dispatch({ type: 'setEngine', engine: initialEngine })
  }, [initialEngine])

  useEffect(() => {
    dispatch({
      type: 'setCurrentPersona',
      currentPersona: appContext.currentPersona
    })
  }, [personas])

  return (
    <AppContext.Provider value={appContext}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppContext.Provider>
  )
}
