'use client'

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppContextProvider } from './AppContext'
import { pathTo } from './Nav'
import { lazy, Suspense } from 'react'
import Layout from './Layout'
import Loader from './Loader'
import { ErrorBoundary } from 'react-error-boundary'
import errorRender from './Errors'

const DocumentationPage = lazy(() => import('./DocumentationPage'))
const PersonasReportsPage = lazy(() => import('./PersonasReportsPage'))

function RouteWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary fallbackRender={errorRender}>
      <Suspense fallback={<Loader />}>{children}</Suspense>
    </ErrorBoundary>
  )
}

const router = createBrowserRouter([
  {
    path: pathTo('home'),
    element: <Layout />,
    children: [
      {
        path: 'doc/*',
        element: (
          <RouteWrapper>
            <DocumentationPage />
          </RouteWrapper>
        )
      },
      {
        path: 'personas/*',
        element: (
          <RouteWrapper>
            <PersonasReportsPage />
          </RouteWrapper>
        )
      }
    ]
  }
])

export default function App() {
  return (
    <div className="App">
      <AppContextProvider>
        <RouterProvider router={router} />
      </AppContextProvider>
    </div>
  )
}
