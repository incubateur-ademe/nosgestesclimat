import { AppContext } from '../AppContext'
import { AppDispatchContext } from '../AppContext'
import { useContext, useEffect, useState } from 'react'
import Editor, { type Monaco } from '@monaco-editor/react'
import { MarkerSeverity, type editor as MonacoEditor } from 'monaco-editor'
import { personas } from '../Personas'
import questionsSchema from '../../json_schemas/questions.schema.json'

const SITUATION_EDITOR_MODEL_URI = 'inmemory://model/ngc-situation.json'
const SITUATION_JSON_SCHEMA_URI = 'ngc://schemas/situation.json'

export default function SituationEditor({
  initialSituationValue
}: {
  initialSituationValue: string | null
}) {
  const { engine, currentPersona } = useContext(AppContext)
  const dispatch = useContext(AppDispatchContext)

  const situation = engine?.getSituation() || {}
  const situationValue = JSON.stringify(situation, null, 2)

  const [situationText, setSituationText] = useState('')

  const [
    shouldBeHydratedWithInitialSituationValue,
    setShouldBeHydratedWithInitialSituationValue
  ] = useState(!!initialSituationValue)

  console.log(
    'shouldBeHydratedWithInitialSituationValue',
    shouldBeHydratedWithInitialSituationValue
  )

  const [editorError, setEditorError] = useState<string | null>(null)
  const [shareFeedback, setShareFeedback] = useState<
    'success' | 'error' | null
  >(null)

  const hasPendingChanges = situationValue !== situationText

  const isModified =
    currentPersona &&
    JSON.stringify(
      { ...engine?.getSituation(), métrique: undefined },
      null,
      2
    ) !==
      JSON.stringify(
        { ...personas[currentPersona].situation, métrique: undefined },
        null,
        2
      )

  // If persona has changed externally, update the editor content to reflect the new situation
  useEffect(() => {
    if (shouldBeHydratedWithInitialSituationValue && initialSituationValue) {
      setSituationText(initialSituationValue)
      setShouldBeHydratedWithInitialSituationValue(false)
    } else {
      setSituationText(situationValue)
    }
    setEditorError(null)
  }, [situationValue])

  const handleEditorMount = (monaco: Monaco) => {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      trailingCommas: 'error',
      schemas: [
        {
          uri: SITUATION_JSON_SCHEMA_URI,
          fileMatch: [SITUATION_EDITOR_MODEL_URI],
          schema: questionsSchema
        }
      ]
    })
  }

  const handleEditorValidate = (markers: MonacoEditor.IMarker[]) => {
    if (situationText.trim().length === 0) {
      setEditorError('La valeur doit être un objet JSON {}.')
      return
    }

    const errorMarker = markers.find(
      (marker) =>
        marker.severity === MarkerSeverity.Error ||
        marker.severity === MarkerSeverity.Warning
    )
    setEditorError(errorMarker?.message ?? null)
  }

  const handleApply = () => {
    if (!hasPendingChanges || editorError) {
      return
    }

    const situationParsed = JSON.parse(situationText)
    engine?.setSituation(situationParsed)
    dispatch({ type: 'setEngine', engine: engine })
  }

  const handleCopyShareLink = async () => {
    const shareParams = new URLSearchParams(window.location.search)
    shareParams.set('situation', situationText)
    if (currentPersona) {
      shareParams.set('persona', currentPersona)
    }
    const shareUrl = `${window.location.origin}${window.location.pathname}?${shareParams.toString()}`
    try {
      await navigator.clipboard.writeText(shareUrl)
      setShareFeedback('success')
    } catch {
      setShareFeedback('error')
    }
  }

  useEffect(() => {
    if (!shareFeedback) {
      return
    }

    const timeout = window.setTimeout(() => {
      setShareFeedback(null)
    }, 1500)

    return () => window.clearTimeout(timeout)
  }, [shareFeedback])

  return (
    <div className="flex h-full flex-col rounded border border-slate-200 bg-slate-50 p-4">
      <h3 className="mt-24 mb-2 text-sm font-semibold">
        Situation{' '}
        {isModified ? (
          <span className="text-red-600 italic">(modifié)</span>
        ) : null}
      </h3>
      <div className="h-[50vh] overflow-hidden rounded border border-slate-300 bg-white">
        <Editor
          height="100%"
          defaultLanguage="json"
          path={SITUATION_EDITOR_MODEL_URI}
          value={situationText}
          onMount={(_, monaco) => handleEditorMount(monaco)}
          onChange={(value) => setSituationText(value ?? '')}
          onValidate={handleEditorValidate}
          options={{
            fontSize: 12,
            minimap: { enabled: false },
            lineNumbersMinChars: 3,
            scrollBeyondLastLine: false,
            tabSize: 2,
            insertSpaces: true,
            wordWrap: 'on',
            automaticLayout: true
          }}
        />
      </div>
      {editorError ? (
        <p className="mt-2 text-xs text-red-600">{editorError}</p>
      ) : null}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-xs text-slate-700 underline decoration-slate-400 underline-offset-2 hover:text-slate-900"
            onClick={handleCopyShareLink}
          >
            Partager la situation
          </button>
          {shareFeedback === 'success' ? (
            <span className="text-sm leading-none" aria-label="Lien copié">
              ✅
            </span>
          ) : null}
          {shareFeedback === 'error' ? (
            <span className="text-sm leading-none" aria-label="Erreur de copie">
              ❌
            </span>
          ) : null}
        </div>
        <button
          type="button"
          disabled={!hasPendingChanges || !!editorError}
          className="bg-primary-500 hover:bg-primary-600 rounded px-4 py-2 font-medium text-white shadow-sm transition disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
          onClick={handleApply}
        >
          Appliquer
        </button>
      </div>
    </div>
  )
}
