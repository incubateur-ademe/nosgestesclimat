import { RulePage } from '@publicodes/react-ui'
import ReactMardown from 'react-markdown'
import { ComponentProps, useContext, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'

import { AppContext } from './AppContext'
import { baseUrl } from './Nav'

const defaultRule = 'bilan'

export default function DocumentationPage() {
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
    <div>
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
