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
    Text: ({ children }) => (
      <div className="markdown">
        <ReactMardown children={children} />
      </div>
    )
  } as ComponentProps<typeof RulePage>['renderers'])

  return (
    <div className="min-h-100">
      <header className="align-center flex items-center justify-between gap-1 border-b border-gray-300 px-8 py-4">
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
  const personasEntries = Object.entries(personas)

  return (
    <div className="">
      {personasEntries.map(([key, persona], i) => {
        const btnClass =
          'border-b border-t border-gray-300 hover:bg-primary-200 px-3 py-1 ' +
          (i === 0
            ? 'rounded-l-md border-l'
            : i === personasEntries.length - 1
              ? 'rounded-r-md border-r border-l'
              : 'border-l') +
          (key === currentPersona ? ' text-primary-500 bg-primary-200' : '')

        return (
          <button
            key={key}
            className={btnClass}
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
