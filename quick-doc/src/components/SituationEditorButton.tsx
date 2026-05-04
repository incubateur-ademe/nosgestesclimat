export default function SituationEditorButton({
  situationEditorOpen,
  setSituationEditorOpen
}: {
  situationEditorOpen: boolean
  setSituationEditorOpen: (open: boolean) => void
}) {
  return (
    <div>
      <button
        className={
          'hover:text-primary-400 border-b-2 ' +
          (situationEditorOpen
            ? 'border-primary-400 text-primary-500'
            : 'border-transparent')
        }
        onClick={() => {
          setSituationEditorOpen(!situationEditorOpen)
        }}
      >
        ✏️ Éditer la situation
      </button>
    </div>
  )
}
