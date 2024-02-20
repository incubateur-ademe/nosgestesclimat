import {
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider
} from 'react-router-dom'
import Documentation from './Documentation'
import { AppContextProvider } from './AppContext'

const baseUrl = process.env.NODE_ENV === 'development' ? '' : '/nosgestesclimat'

export default function App() {
  return (
    <div className="App">
      <RouterProvider
        router={createBrowserRouter(
          createRoutesFromElements([
            <Route
              path={`${baseUrl}/*`}
              element={
                <AppContextProvider>
                  <Documentation baseUrl={baseUrl} />
                </AppContextProvider>
              }
            />
          ])
        )}
      />
    </div>
  )
}
