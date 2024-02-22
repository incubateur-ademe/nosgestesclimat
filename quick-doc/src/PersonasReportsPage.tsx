import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Loader from './Loader'
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState
} from 'react'
import { AppContext } from './AppContext'
import { CheckCircle2, Loader2, RefreshCw } from 'lucide-react'

export default function PersonasReportsPage() {
  const { currentPersona, reportManager } = useContext(AppContext)
  const [report, setReport] = useState<string | null>(null)
  const [syncing, setSyncing] = useState('none')

  useEffect(() => {
    // Needed to show the loader when changing personas
    setReport(null)
    reportManager?.setPersonasReportsPage(currentPersona, setReport)
  }, [currentPersona])

  useEffect(() => {
    if (syncing === 'requested') {
      reportManager?.setPersonasReportsPage(
        currentPersona,
        (r) => {
          setReport(r)
          setSyncing('done')
        },
        true
      )
    }
    if (syncing === 'done') {
      setTimeout(() => {
        setSyncing('none')
      }, 1000)
    }
  }, [syncing])

  if (report == null || report === '') {
    return <Loader />
  }

  return (
    <div className="flex flex-col items-end p-8">
      <SyncButton syncing={syncing} setSyncing={setSyncing} />
      <Markdown
        remarkPlugins={[remarkGfm]}
        className="prose prose-lg min-w-full"
        children={report}
      />
    </div>
  )
}

function SyncButton({
  syncing,
  setSyncing
}: {
  syncing: string
  setSyncing: Dispatch<SetStateAction<string>>
}) {
  switch (syncing) {
    case 'none': {
      return (
        <button
          className="bg-secondary hover:bg-primary-300 flex  items-center gap-2 rounded px-4  py-2 text-white"
          onClick={() => setSyncing('requested')}
        >
          <RefreshCw size={16} />
        </button>
      )
    }

    case 'requested': {
      return (
        <button
          className="flex w-fit items-center gap-2 rounded bg-orange-400 px-4 py-2 text-white"
          disabled
        >
          <Loader2 className="animate-spin" size={16} />
        </button>
      )
    }

    case 'done': {
      return (
        <button
          className="flex w-fit items-center gap-2 rounded bg-green-500 px-4 py-2 text-white"
          disabled
        >
          <CheckCircle2 size={16} />
        </button>
      )
    }
  }
}
