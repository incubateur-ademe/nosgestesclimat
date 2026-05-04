import { AppContext, AppDispatchContext } from '../AppContext'
import { useContext } from 'react'
import { twMerge } from 'tailwind-merge'

export default function MetricToggle() {
  const { currentMetric } = useContext(AppContext)
  const dispatch = useContext(AppDispatchContext)

  return (
    <div className="inline-flex">
      <button
        className={twMerge(
          'hover:bg-primary-200 bg-primary-100 rounded-l px-4 py-2',
          currentMetric === 'carbone' ? 'text-primary-500 font-bold' : ''
        )}
        onClick={() => {
          dispatch({
            type: 'setCurrentMetric',
            currentMetric: 'carbone'
          })
        }}
      >
        ⚫️ Carbone
      </button>{' '}
      <button
        className={twMerge(
          'hover:bg-primary-200 bg-primary-100 rounded-r px-4 py-2',
          currentMetric === 'eau' ? 'text-primary-500 font-bold' : ''
        )}
        onClick={() => {
          dispatch({
            type: 'setCurrentMetric',
            currentMetric: 'eau'
          })
        }}
      >
        Eau 💧
      </button>
    </div>
  )
}
