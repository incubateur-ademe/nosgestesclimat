import MetricToggle from './MetricToggle'
import SituationEditorToggle from './SituationEditorButton'

export default function DocumentationToggles({
  situationEditorOpen,
  setSituationEditorOpen
}: {
  situationEditorOpen: boolean
  setSituationEditorOpen: (open: boolean) => void
}) {
  return (
    <div className="absolute right-[3%] mt-2 flex flex-col items-end space-y-2">
      <MetricToggle />
      <SituationEditorToggle
        situationEditorOpen={situationEditorOpen}
        setSituationEditorOpen={setSituationEditorOpen}
      />
    </div>
  )
}
