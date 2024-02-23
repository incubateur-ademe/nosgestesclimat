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
const HomePage = lazy(() => import('./HomePage'))

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
    element: (
      <ErrorBoundary fallbackRender={errorRender}>
        <Layout />
      </ErrorBoundary>
    ),
    children: [
      {
        path: '/',
        element: (
          <RouteWrapper>
            <HomePage />
          </RouteWrapper>
        )
      },
      {
        path: pathTo('doc') + '/*',
        element: (
          <RouteWrapper>
            <DocumentationPage />
          </RouteWrapper>
        )
      },
      {
        path: pathTo('personas') + '/*',
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
