import migrationReport from '../../migration-report.md?raw'
import Markdown from '../components/Markdown'

export default function MigrationReportPage() {
  return (
    <div className="flex flex-col items-start p-8">
      <h3 className="text-2xl font-bold">Statut du fichier de migration</h3>
      <div className="mt-8 min-w-full rounded border border-gray-200 bg-white px-8 py-4">
        {migrationReport !== null ? <Markdown file={migrationReport} /> : null}
      </div>
    </div>
  )
}
