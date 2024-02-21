import { RulePage } from '@publicodes/react-ui'
import ReactMardown from 'react-markdown'
import { ComponentProps, useContext, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { AppContext } from './AppContext'
import { pathTo } from './Nav'

const defaultRule = 'bilan'

export default function DocumentationPage() {
  const { engine } = useContext(AppContext)
  const [currentEngine, setCurrentEngine] = useState(engine)

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

  useEffect(() => {
    console.log(
      'new engine:',
      engine?.getParsedRules()['bilan'].rawNode.formule
    )
    console.log(
      'currentEngine:',
      currentEngine?.getParsedRules()['bilan'].rawNode.formule
    )
    setCurrentEngine(engine)
  }, [engine])

  return (
    <div>
      <RulePage
        documentationPath={pathTo('doc')}
        rulePath={rulePath}
        engine={currentEngine as any}
        renderers={renderers}
        language={'fr'}
        npmPackage="nosgestesclimat"
      />
    </div>
  )
}
