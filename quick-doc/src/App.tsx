'use client'

import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import AppContextProvider from './AppContextProvider'
import { pathTo } from './Nav'
import { lazy, Suspense } from 'react'
import Layout from './components/Layout'
import Loader from './components/Loader'
import { ErrorBoundary } from 'react-error-boundary'
import errorRender from './components/Errors.tsx'
import SituationCoveragePage from './pages/SituationCoveragePage'
import MigrationReportPage from './pages/MigrationReportPage.tsx'

const DocumentationPage = lazy(() => import('./pages/DocumentationPage'))
const PersonasReportsPage = lazy(() => import('./pages/PersonasReportsPage'))
const HomePage = lazy(() => import('./pages/HomePage'))

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
      },
      {
        path: pathTo('situations') + '/*',
        element: (
          <RouteWrapper>
            <SituationCoveragePage />
          </RouteWrapper>
        )
      },
      {
        path: pathTo('migration') + '/*',
        element: (
          <RouteWrapper>
            <MigrationReportPage />
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
