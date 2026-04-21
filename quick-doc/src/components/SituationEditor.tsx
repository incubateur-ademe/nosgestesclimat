import { AppContext } from '../AppContext'
import { AppDispatchContext } from '../AppContext'
import { useContext, useEffect, useState } from 'react'
import { personas } from '../Personas'

export default function SituationEditor() {
  const { engine, currentPersona } = useContext(AppContext)
  const dispatch = useContext(AppDispatchContext)

  const situation = engine?.getSituation() || {}
  const situationText = JSON.stringify(situation, null, 2)
  const [situationValue, setSituationValue] = useState(situationText)
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
  }, [situationText])

  const handleApply = () => {
    if (!hasPendingChanges) {
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
      <textarea
        className="max-h-[50vh] w-full flex-1 rounded border border-slate-300 bg-white p-3 font-mono text-xs"
        value={situationValue}
        onChange={(e) => {
          setSituationValue(e.target.value)
        }}
      />
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          disabled={!hasPendingChanges}
          className="bg-primary-500 hover:bg-primary-600 rounded px-4 py-2 font-medium text-white shadow-sm transition disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
          onClick={handleApply}
        >
          Appliquer
        </button>
      </div>
    </div>
  )
}
