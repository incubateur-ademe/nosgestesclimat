import coverageReport from '../../situation-coverage.md?raw'
import Markdown from '../components/Markdown'

export default function SituationCoveragePage() {
  return (
    <div className="flex flex-col items-start p-8">
      <h3 className="text-2xl font-bold">Coverage des situations</h3>
      <div className="mt-8 min-w-full rounded border border-gray-200 bg-white px-8 py-4">
        {coverageReport !== null ? <Markdown file={coverageReport} /> : null}
      </div>
    </div>
  )
}
