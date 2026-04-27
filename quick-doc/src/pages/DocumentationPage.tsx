import { RulePage } from '@publicodes/react-ui'
import ReactMardown from 'react-markdown'
import { ComponentProps, useContext, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { AppContext, AppDispatchContext } from '../AppContext'
import { pathTo } from '../Nav'
import Loader from '../components/Loader'
import remarkGfm from 'remark-gfm'
import Engine from 'publicodes'
import SituationEditor from '../components/SituationEditor'
import DocumentationToggle from '../components/DocumentationToggle'
import { personas, type PersonaKey } from '../Personas'
const defaultRule = 'bilan'

export default function DocumentationPage() {
  const { engine } = useContext(AppContext)
  const dispatch = useContext(AppDispatchContext)
  const [currentEngine, setCurrentEngine] = useState(engine)
  const [situationEditorOpen, setSituationEditorOpen] = useState(false)

  const url = useParams()['*']
  const rulePath = !url || url === '' ? defaultRule : url

  const searchParams = new URLSearchParams(window.location.search)
  const sharedSituationText = searchParams.get('situation')
  const sharedPersona = searchParams.get('persona')

  const { current: renderers } = useRef({
    Link,
    Text: ({ children }) => (
      <div className="markdown">
        <ReactMardown remarkPlugins={[remarkGfm]} children={children} />
      </div>
    )
  } as ComponentProps<typeof RulePage>['renderers'])

  useEffect(() => {
    setCurrentEngine(engine)
  }, [engine])

  useEffect(() => {
    if (!engine) {
      return
    }

    if (sharedPersona && sharedPersona in personas) {
      dispatch({
        type: 'setCurrentPersona',
        currentPersona: sharedPersona as PersonaKey
      })
    }

    if (sharedSituationText) {
      setSituationEditorOpen(true)
    }
  }, [dispatch, engine])

  return !currentEngine ? (
    <Loader delay={0} />
  ) : (
    <div>
      <DocumentationToggle
        situationEditorOpen={situationEditorOpen}
        setSituationEditorOpen={setSituationEditorOpen}
      />
      <div
        className={`${situationEditorOpen ? 'grid grid-cols-[70%_30%]' : 'grid grid-cols-[100%]'}`}
      >
        <RulePage
          documentationPath={pathTo('doc')}
          rulePath={rulePath}
          engine={currentEngine as Engine}
          renderers={renderers}
          searchBar={false}
          language={'fr'}
          npmPackage="nosgestesclimat"
        />
        {situationEditorOpen && (
          <SituationEditor initialSituationValue={sharedSituationText} />
        )}
      </div>
    </div>
  )
}
