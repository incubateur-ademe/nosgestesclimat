import { AppContext } from '../AppContext'
import { AppDispatchContext } from '../AppContext'
import { useContext, useEffect, useState } from 'react'
import Editor, { type Monaco } from '@monaco-editor/react'
import { MarkerSeverity, type editor as MonacoEditor } from 'monaco-editor'
import { personas } from '../Personas'
import questionsSchema from '../../json_schemas/questions.schema.json'

const SITUATION_EDITOR_MODEL_URI = 'inmemory://model/ngc-situation.json'
const SITUATION_JSON_SCHEMA_URI = 'ngc://schemas/situation.json'

export default function SituationEditor() {
  const { engine, currentPersona } = useContext(AppContext)
  const dispatch = useContext(AppDispatchContext)

  const situation = engine?.getSituation() || {}
  const situationText = JSON.stringify(situation, null, 2)
  const [situationValue, setSituationValue] = useState(situationText)
  const [editorError, setEditorError] = useState<string | null>(null)
  const hasPendingChanges = situationValue !== situationText

  const isModified =
    currentPersona &&
    JSON.stringify({ ...situation, métrique: undefined }, null, 2) !==
      JSON.stringify(
        { ...personas[currentPersona].situation, métrique: undefined },
        null,
        2
      )

  useEffect(() => {
    setSituationValue(situationText)
    setEditorError(null)
  }, [situationText])

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
    if (situationValue.trim().length === 0) {
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

    const situationParsed = JSON.parse(situationValue)
    engine?.setSituation(situationParsed)
    dispatch({ type: 'setEngine', engine: engine })
  }

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
          value={situationValue}
          onMount={(_, monaco) => handleEditorMount(monaco)}
          onChange={(value) => setSituationValue(value ?? '')}
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
      <div className="mt-3 flex justify-end gap-2">
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
