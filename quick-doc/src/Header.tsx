import { useContext } from 'react'
import { AppContext, AppDispatchContext } from './AppContext'
import { PersonaKey, personasEntries } from './Personas'
import { pathTo } from './Nav'
import { Link } from 'react-router-dom'

export default function Header() {
  return (
    <header className="align-center flex items-center justify-between gap-1 border-b border-gray-300 bg-white">
      <div className="mx-8 my-4 flex flex-wrap">
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
    <div className="flex h-full flex-wrap gap-1 border-l border-gray-300 px-8 py-4">
      {personasEntries.map(([key, persona]) => {
        const btnClass =
          'rounded hover:bg-primary-100 px-3 py-1 ' +
          (key === currentPersona ? ' bg-primary-100 text-primary-500' : '')

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
