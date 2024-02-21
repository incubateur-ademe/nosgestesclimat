import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Loader from './Loader'
import { useContext, useEffect, useState } from 'react'
import { AppContext } from './AppContext'
import axios from 'axios'

export default function PersonasReportsPage() {
  const { currentPersona } = useContext(AppContext)
  const [report, setReport] = useState<string | null>(null)

  // TODO: cache the reports
  useEffect(() => {
    setReport(null)
    axios.get(`http://localhost:4000/${currentPersona}`).then((response) => {
      setReport(response.data)
    })
  }, [currentPersona])

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
