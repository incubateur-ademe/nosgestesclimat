import { useEffect, useState } from 'react'

export default function Loader({ delay = 500 }: { delay?: number }) {
  const [waiting, setWaiting] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setWaiting(false)
    }, delay)
  }, [])

  return waiting ? null : (
    <div className="flex min-h-[90vh] items-center justify-center">
      <p className="w-50 h-50 animate-ping text-5xl">⚡️</p>
    </div>
  )
}
