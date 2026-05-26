import axios from 'axios'
import { CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

type Status = 'request' | 'compiling' | 'done' | 'error' | 'none'

export default function CompilePersonasButton() {
  const [status, setStatus] = useState<Status>('none')
  const onDone = () => setStatus('done')
  const onError = () => setStatus('error')

  useEffect(() => {
    switch (status) {
      case 'request': {
        setStatus('compiling')
        compilePersona(onDone, onError)
        break
      }
      case 'done': {
        setTimeout(() => {
          setStatus('none')
        }, 800)
        break
      }
    }
  }, [status])

  switch (status) {
    case 'none': {
      return (
        <button
          className="bg-secondary hover:bg-primary-300 flex items-center gap-2 rounded px-4 py-2 text-white"
          onClick={() => setStatus('request')}
        >
          <RefreshCw size={16} />
        </button>
      )
    }
    case 'compiling': {
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
          onClick={() => setStatus('request')}
        >
          <XCircle size={16} />
          <span>Vérifie ta connexion</span>
        </button>
      )
    }
    default: {
      return null
    }
  }
}

function compilePersona(onDone: () => void, onError: () => void) {
  axios
    .get(`http://localhost:4000/compile-personas`)
    .then((_response) => {
      onDone()
    })
    .catch((error: Error) => {
      console.log(`[compile-personas] error fetching: ${error.message}`)
      onError()
    })
}
