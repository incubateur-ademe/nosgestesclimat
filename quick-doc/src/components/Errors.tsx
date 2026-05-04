import { FallbackProps } from 'react-error-boundary'

export default function errorRender({
  error,
  resetErrorBoundary
}: FallbackProps) {
  const message = error instanceof Error ? error.message : String(error)

  console.error(error)
  return (
    <div role="alert" className="bg-red-100 p-4">
      <p className="font-bold">Une erreur est survenue:</p>
      <pre className="text-red-500">{message}</pre>
      <button
        className="mt-4 rounded-md border border-red-500 p-2
		"
        onClick={(_) => resetErrorBoundary()}
      >
        Recharger la page
      </button>
    </div>
  )
}
