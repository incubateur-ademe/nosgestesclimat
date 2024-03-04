import { Outlet } from 'react-router-dom'
import Header from './Header'
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import { CheckCircle2, Loader2, XCircle } from 'lucide-react'

type CompilationStatus = {
  type: 'compiling' | 'ok' | 'error' | 'none'
  message?: string
}

const socket = io('http://localhost:4000')

export default function Layout() {
  // NOTE(@EmileRolley): When the rules are compiled, this component will be HMR updated
  // therefore the compilation status will be reset to 'none'.
  const [compilationStatus, setCompilationStatus] = useState<CompilationStatus>(
    { type: 'none' }
  )

  useEffect(() => {
    socket.on('connection', () => {
      console.log('connected')
    })
    socket.on('compilation-status', (status: CompilationStatus) => {
      setCompilationStatus(status)
    })
  }, [])

  useEffect(() => {
    if (compilationStatus.type === 'ok') {
      setTimeout(() => {
        setCompilationStatus({ type: 'none' })
      }, 1000)
    }
  }, [compilationStatus])

  return (
    <div className="min-h-100">
      <Header />
      <div>
        <CompilationStatusAlert status={compilationStatus} />
        <Outlet />
      </div>
    </div>
  )
}

function CompilationStatusAlert({ status }: { status: CompilationStatus }) {
  switch (status.type) {
    case 'compiling': {
      return (
        <div
          className="flex items-center gap-2 border-l-4 border-amber-500 bg-amber-200 p-4 text-amber-700"
          role="alert"
        >
          <Loader2 className="animate-spin" size={16} />
          <p className="font-bold">Compilation en cours</p>
          <p>{status.message}</p>
        </div>
      )
    }
    case 'ok': {
      return (
        <div
          className="flex items-center gap-2 border-l-4 border-green-500 bg-green-200 p-4 text-green-700"
          role="alert"
        >
          <CheckCircle2 size={16} />
          <p className="font-bold">Compilation réussie</p>
          <p>{status.message}</p>
        </div>
      )
    }
    case 'error': {
      return (
        <div
          className="flex items-center gap-2 border-l-4 border-red-500 bg-red-200 p-4 text-red-700"
          role="alert"
        >
          <XCircle size={16} />
          <p className="font-bold">Compilation échouée</p>
          <p>{status.message}</p>
        </div>
      )
    }
    case 'none': {
      return null
    }
  }
}
