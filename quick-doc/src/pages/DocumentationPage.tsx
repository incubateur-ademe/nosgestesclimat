import { RulePage } from '@publicodes/react-ui'
import ReactMardown from 'react-markdown'
import { ComponentProps, useContext, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { AppContext } from '../AppContext'
import { pathTo } from '../Nav'
import Loader from '../components/Loader'
import remarkGfm from 'remark-gfm'
import Engine from 'publicodes'
import SituationEditor from '../components/SituationEditor'
import DocumentationToggle from '../components/DocumentationToggle'
const defaultRule = 'bilan'

export default function DocumentationPage() {
  const { engine } = useContext(AppContext)
  const [currentEngine, setCurrentEngine] = useState(engine)
  const [situationEditorOpen, setSituationEditorOpen] = useState(false)

  const url = useParams()['*']
  const rulePath = !url || url === '' ? defaultRule : url

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
        {situationEditorOpen && <SituationEditor />}
      </div>
    </div>
  )
}
