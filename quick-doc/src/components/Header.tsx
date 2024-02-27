import { useContext } from 'react'
import { AppContext, AppDispatchContext } from '../AppContext'
import { PersonaKey, personasEntries } from '../Personas'
import { Page, pathTo } from '../Nav'
import { Link, useLocation } from 'react-router-dom'
// import CompilePersonasButton from './CompilePersonasButton'

export default function Header() {
  const location = useLocation()
  const link = (page: Page, label: string) => {
    const path = pathTo(page)

    return (
      <Link
        className={
          'hover:test-primary-400 border-b-2' +
          (location.pathname.startsWith(path)
            ? ' border-primary-400 text-primary-500'
            : ' border-transparent')
        }
        to={path}
      >
        {label}
      </Link>
    )
  }

  return (
    <header className="align-center flex items-center justify-between gap-1 border-b border-gray-300 bg-white">
      <div className="mx-8 my-4 flex flex-wrap">
        <h2 className="font-semibold">
          <Link to={pathTo('home')}>⚡️ QuickDoc</Link>
        </h2>
        <div className="ml-4 flex gap-4">
          {link('doc', 'Documentation')}
          {link('personas', 'Tests')}
          {link('situations', 'Situations')}
          {link('migration', 'Migration')}
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
    <div>
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
    </div>
  )
}
