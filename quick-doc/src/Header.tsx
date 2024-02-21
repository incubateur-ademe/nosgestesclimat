import { useContext } from 'react'
import { AppContext, AppDispatchContext } from './AppContext'
import { PersonaKey, personasEntries } from './Personas'
import { pathTo } from './Nav'
import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="align-center flex items-center justify-between gap-1 border-b border-gray-300 px-8 py-4">
      <div className="flex">
        <h2 className="font-semibold">
          <Link to={pathTo('home')}>⚡️ QuickDoc</Link>
        </h2>
        <div className="ml-4 flex gap-2">
          <Link className="hover:text-primary-400" to={pathTo('doc')}>
            Documentation
          </Link>
          <Link className="hover:text-primary-400" to={pathTo('personas')}>
            Tests
          </Link>
        </div>
      </div>
      <PersonasHeader />
    </header>
  )
}

function PersonasHeader() {
  const { currentPersona } = useContext(AppContext)
  const dispatch = useContext(AppDispatchContext)

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
