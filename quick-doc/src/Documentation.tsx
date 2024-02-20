import { RulePage } from '@publicodes/react-ui'
import ReactMardown from 'react-markdown'
import { ComponentProps, useContext, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'

import { AppContext, AppDispatchContext } from './AppContext'
import { PersonaKey, personas } from './Personas'

const defaultRule = 'bilan'

export type DocumentationProps = {
  baseUrl: string
}

export default function Documentation({ baseUrl }: DocumentationProps) {
  const { engine } = useContext(AppContext)
  const url = useParams()['*']
  const rulePath = !url || url === '' ? defaultRule : url

  const { current: renderers } = useRef({
    Link,
    Text: ({ children }) => <ReactMardown children={children} />
  } as ComponentProps<typeof RulePage>['renderers'])

  return (
    <div>
      <header className="border-primary-200 align-center flex items-center justify-between gap-1 border-b p-4">
        <h2 className="font-semibold">⚡️ QuickDoc</h2>
        <PersonasHeader />
      </header>
      <RulePage
        documentationPath={`${baseUrl}`}
        rulePath={rulePath}
        engine={engine as any}
        renderers={renderers}
        language={'fr'}
        npmPackage="nosgestesclimat"
      />
    </div>
  )
}

function PersonasHeader() {
  const { currentPersona } = useContext(AppContext)
  const dispatch = useContext(AppDispatchContext)

  return (
    <div className="">
      {Object.entries(personas).map(([key, persona]) => {
        return key === currentPersona ? (
          <button
            key={key}
            className="bg-primary-200 border-primary-200 hover:bg-primary-200 mx-2 rounded-md border px-2 py-1"
          >
            {persona.nom}
          </button>
        ) : (
          <button
            key={key}
            className="border-primary-200 hover:bg-primary-200 mx-2 rounded-md border px-2 py-1"
            onClick={() => {
              dispatch({
                type: 'setCurrentPersona',
                currentPersona: key as PersonaKey
              })
            }}
          >
            {persona.nom}
          </button>
        )
      })}
    </div>
  )
}
