import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState
} from 'react'
import { AppContext } from '../AppContext'
import { CheckCircle2, Loader2, Play, XCircle } from 'lucide-react'
import { Version, versionFromString } from '../Versions'
import { defaultPersona, personas } from '../Personas'

type SyncStatus = 'none' | 'loading' | 'requested' | 'done' | 'error'

export default function PersonasReportsPage() {
  const { currentPersona, reportManager } = useContext(AppContext)
  const [report, setReport] = useState<string | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('none')
  const [version, setVersion] = useState<Version>('nightly')
  const [timeElapsed, setTimeElapsed] = useState<number | 'cached' | 'none'>(
    'none'
  )
  const persona = personas[currentPersona ?? defaultPersona]

  const setSyncedReport = (r: string, cached: boolean) => {
    setReport(r)
    if (cached) {
      setTimeElapsed('cached')
    }
    setSyncStatus('done')
  }

  const onError = () => {
    setSyncStatus('error')
  }

  useEffect(() => {
    console.log('currentPersona', currentPersona)
    if (!currentPersona || !reportManager) {
      return
    }

    const cachedReport = reportManager.getCachedReport(currentPersona, version)

    if (cachedReport) {
      setReport(cachedReport)
      setTimeElapsed('cached')
      setSyncStatus('none')
    } else {
      setReport(null)
      setSyncStatus('none')
      setTimeElapsed('none')
    }
  }, [currentPersona, version])

  useEffect(() => {
    if (syncStatus === 'requested') {
      setSyncStatus('loading')
      setTimeElapsed('none')
      reportManager?.fetchReport(
        currentPersona,
        version,
        setSyncedReport,
        setTimeElapsed,
        onError,
        report !== null
      )
    }
    if (syncStatus === 'done') {
      setTimeout(() => {
        setSyncStatus('none')
      }, 800)
    }
  }, [syncStatus])

  return (
    <div className="align-center flex flex-col items-start p-8">
      <h2 className="mb-6 text-4xl font-bold">
        <span className="mr-2 text-3xl">{persona.icônes}</span> {persona.nom}
      </h2>
      <p className="prose mb-6 max-w-7xl">{persona.description}</p>
      <h3 className="mb-8 text-2xl font-bold">Rapport de test</h3>
      <div className="flex items-center gap-2">
        <VersionSelector
          version={version}
          setVersion={setVersion}
          isDisabled={syncStatus !== 'none'}
        />
        <SyncButton syncStatus={syncStatus} setSyncStatus={setSyncStatus} />
        {timeElapsed === 'none' ? null : (
          <span className="text-sm text-gray-500">
            {timeElapsed === 'cached' ? 'Rapport en cache' : `${timeElapsed}ms`}
          </span>
        )}
      </div>
      <div className="mt-8 min-w-full rounded border border-gray-200 bg-white px-8 py-4">
        {report !== null ? (
          <Markdown
            remarkPlugins={[remarkGfm]}
            className="prose prose-lg prose-blockquote:bg-grey-200 min-w-full"
            children={report}
          />
        ) : (
          <TableSkeleton loading={syncStatus === 'loading'} />
        )}
      </div>
    </div>
  )
}

// TODO: factorize with CompilePersonasButton
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
          className="bg-primary-500 hover:bg-primary-300 flex items-center gap-2 rounded px-4 py-2 text-white"
          onClick={() => setSyncStatus('requested')}
        >
          Lancer
          <Play size={16} />
        </button>
      )
    }

    case 'loading': {
      return (
        <button
          className="flex items-center gap-2 rounded bg-orange-400 px-4 py-2 text-white"
          disabled
        >
          Chargement
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
          Fait
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
    default:
      return null
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

function TableSkeleton({ loading }: { loading: boolean }) {
  return (
    <div className={'flex space-x-4' + (loading ? ' animate-pulse' : '')}>
      <div className="flex-1 space-y-8 py-1">
        <div className="h-4 w-36 rounded bg-gray-600"></div>
        <div className="space-y-6">
          <div className="grid grid-cols-11 gap-8">
            <div className="col-span-6 h-4 rounded bg-gray-500"></div>
            <div className="col-span-2 h-4 rounded bg-gray-500"></div>
            <div className="col-span-2 h-4 rounded bg-gray-500"></div>
            <div className="col-span-1 h-4 rounded bg-gray-500"></div>
          </div>
          <div className="grid grid-cols-11 gap-8">
            <div className="col-span-6 h-2 rounded bg-gray-300"></div>
            <div className="col-span-2 h-2 rounded bg-gray-300"></div>
            <div className="col-span-2 h-2 rounded bg-gray-300"></div>
            <div className="col-span-1 h-2 rounded bg-gray-300"></div>
          </div>
          <div className="grid grid-cols-11 gap-8">
            <div className="col-span-6 h-2 rounded bg-gray-300"></div>
            <div className="col-span-2 h-2 rounded bg-gray-300"></div>
            <div className="col-span-2 h-2 rounded bg-gray-300"></div>
            <div className="col-span-1 h-2 rounded bg-gray-300"></div>
          </div>
          <div className="grid grid-cols-11 gap-8">
            <div className="col-span-6 h-2 rounded bg-gray-300"></div>
            <div className="col-span-2 h-2 rounded bg-gray-300"></div>
            <div className="col-span-2 h-2 rounded bg-gray-300"></div>
            <div className="col-span-1 h-2 rounded bg-gray-300"></div>
          </div>
          <div className="grid grid-cols-11 gap-8">
            <div className="col-span-6 h-2 rounded bg-gray-300"></div>
            <div className="col-span-2 h-2 rounded bg-gray-300"></div>
            <div className="col-span-2 h-2 rounded bg-gray-300"></div>
            <div className="col-span-1 h-2 rounded bg-gray-300"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
