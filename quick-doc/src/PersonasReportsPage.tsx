import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Loader from './Loader'
import { useContext, useEffect, useState } from 'react'
import { AppContext } from './AppContext'
import res from '../reports/res.md?raw'

export default function PersonasReportsPage() {
  const { currentPersona } = useContext(AppContext)
  const [report, setReport] = useState<string | null>(null)

  useEffect(() => {
    setReport(res)
  }, [currentPersona, res])

  if (report == null || report === '') {
    return <Loader />
  }

  return (
    <div className="flex flex-col p-8">
      <Markdown
        remarkPlugins={[remarkGfm]}
        className="prose prose-lg min-w-full"
        children={report}
      />
    </div>
  )
}
