import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState
} from 'react'
import { AppContext } from './AppContext'
import { CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react'
import { Version, versionFromString } from './Versions'

type SyncStatus = 'none' | 'loading' | 'requested' | 'done' | 'error'

export default function PersonasReportsPage() {
  const { currentPersona, reportManager } = useContext(AppContext)
  const [report, setReport] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('none')
  const [version, setVersion] = useState<Version>('nightly')

  const setSyncedReport = (r: string, _cacheHit: boolean) => {
    setReport(r)
    setSyncStatus('done')
  }
  const onError = () => {
    setSyncStatus('error')
  }

  useEffect(() => {
    setReport(null)
    setSyncStatus('loading')
    reportManager?.fetchReport(
      currentPersona,
      version,
      setSyncedReport,
      onError
    )
  }, [currentPersona, version])

  useEffect(() => {
    if (syncStatus === 'requested') {
      setSyncStatus('loading')
      reportManager?.fetchReport(
        currentPersona,
        version,
        setSyncedReport,
        onError,
        true
      )
    }
    if (syncStatus === 'done') {
      setTimeout(() => {
        setSyncStatus('none')
      }, 800)
    }
  }, [syncStatus])

  return (
    <div className="flex flex-col items-end p-8">
      <div className="flex gap-2">
        <SyncButton syncStatus={syncStatus} setSyncStatus={setSyncStatus} />
        <VersionSelector
          version={version}
          setVersion={setVersion}
          isDisabled={syncStatus !== 'none'}
        />
      </div>
      <div className="mt-8 min-w-full rounded border border-gray-200 bg-white px-8 py-4">
        {report !== null ? (
          <Markdown
            remarkPlugins={[remarkGfm]}
            className="prose prose-lg min-w-full"
            children={report}
          />
        ) : (
          <TableSkeleton />
        )}
      </div>
    </div>
  )
}

function SyncButton({
  syncStatus,
  setSyncStatus
}: {
  syncStatus: SyncStatus
  setSyncStatus: Dispatch<SetStateAction<SyncStatus>>
}) {
  switch (syncStatus) {
    case 'none': {
      return (
        <button
          className="bg-secondary hover:bg-primary-300 flex items-center gap-2 rounded px-4 py-2 text-white"
          onClick={() => setSyncStatus('requested')}
        >
          <RefreshCw size={16} />
        </button>
      )
    }

    case 'loading': {
      return (
        <button
          className="flex items-center gap-2 rounded bg-orange-400 px-4 py-2 text-white"
          disabled
        >
          <Loader2 className="animate-spin" size={16} />
        </button>
      )
    }

    case 'done': {
      return (
        <button
          className="flex items-center gap-2 rounded bg-green-500 px-4 py-2 text-white"
          disabled
        >
          <CheckCircle2 size={16} />
        </button>
      )
    }
    case 'error': {
      return (
        <button
          className="flex items-center gap-2 rounded bg-red-500 px-4 py-2 text-white"
          onClick={() => setSyncStatus('requested')}
        >
          <XCircle size={16} />
          <span>Vérifie ta connexion</span>
        </button>
      )
    }
  }
}

function VersionSelector({
  version,
  setVersion,
  isDisabled
}: {
  version: Version
  setVersion: Dispatch<SetStateAction<Version>>
  isDisabled: boolean
}) {
  const options = (
    <>
      <option
        className={version === 'nightly' ? ' selected' : ''}
        value="nightly"
      >
        Nightly (preprod)
      </option>
      <option className={version === 'latest' ? 'selected' : ''} value="latest">
        Latest (master)
      </option>
    </>
  )

  return isDisabled ? (
    <select
      className="cursor-not-allowed rounded border border-gray-200 bg-gray-100 px-4 py-2"
      disabled
    >
      {options}
    </select>
  ) : (
    <select
      className="cursor-pointer rounded border border-gray-300 bg-white px-4 py-2 hover:border-gray-300"
      onChange={(e) => setVersion(versionFromString(e.target.value))}
    >
      {options}
    </select>
  )
}

function TableSkeleton() {
  return (
    <div class="flex animate-pulse space-x-4">
      <div class="flex-1 space-y-8 py-1">
        <div class="h-4 w-36 rounded bg-gray-600"></div>
        <div class="space-y-6">
          <div class="grid grid-cols-11 gap-8">
            <div class="col-span-6 h-4 rounded bg-gray-500"></div>
            <div class="col-span-2 h-4 rounded bg-gray-500"></div>
            <div class="col-span-2 h-4 rounded bg-gray-500"></div>
            <div class="col-span-1 h-4 rounded bg-gray-500"></div>
          </div>
          <div class="grid grid-cols-11 gap-8">
            <div class="col-span-6 h-2 rounded bg-gray-300"></div>
            <div class="col-span-2 h-2 rounded bg-gray-300"></div>
            <div class="col-span-2 h-2 rounded bg-gray-300"></div>
            <div class="col-span-1 h-2 rounded bg-gray-300"></div>
          </div>
          <div class="grid grid-cols-11 gap-8">
            <div class="col-span-6 h-2 rounded bg-gray-300"></div>
            <div class="col-span-2 h-2 rounded bg-gray-300"></div>
            <div class="col-span-2 h-2 rounded bg-gray-300"></div>
            <div class="col-span-1 h-2 rounded bg-gray-300"></div>
          </div>
          <div class="grid grid-cols-11 gap-8">
            <div class="col-span-6 h-2 rounded bg-gray-300"></div>
            <div class="col-span-2 h-2 rounded bg-gray-300"></div>
            <div class="col-span-2 h-2 rounded bg-gray-300"></div>
            <div class="col-span-1 h-2 rounded bg-gray-300"></div>
          </div>
          <div class="grid grid-cols-11 gap-8">
            <div class="col-span-6 h-2 rounded bg-gray-300"></div>
            <div class="col-span-2 h-2 rounded bg-gray-300"></div>
            <div class="col-span-2 h-2 rounded bg-gray-300"></div>
            <div class="col-span-1 h-2 rounded bg-gray-300"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
