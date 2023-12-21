import Engine from 'publicodes'
import './App.css'
import { RulePage } from 'publicodes-react'
import {
  Link,
  Route,
  useParams,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider
} from 'react-router-dom'
import { ComponentProps, useRef } from 'react'
import ReactMardown from 'react-markdown'

import rules from '../../public/co2-model.FR-lang.fr.json'

let engine = new Engine()

try {
  engine = new Engine(rules as {})
} catch (e) {
  console.error('Error while loading model:')
  console.error(e)
}

const baseUrl = process.env.NODE_ENV === 'development' ? '' : '/nosgestesclimat'

const defaultRule = 'bilan'

function Documentation() {
  const url = useParams()['*']
  const { current: renderers } = useRef({
    Link,
    Text: ({ children }) => <ReactMardown children={children} />
  } as ComponentProps<typeof RulePage>['renderers'])

  return (
    <div>
      <RulePage
        documentationPath={`${baseUrl}`}
        rulePath={!url || url === '' ? defaultRule : url}
        engine={engine}
        renderers={renderers}
        language={'fr'}
        npmPackage="nosgestesclimat"
      />
    </div>
  )
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path={`${baseUrl}/*`} element={<Documentation />} />
  )
)

export default function App() {
  return (
    <div className="App">
      <RouterProvider router={router} />
    </div>
  )
}
