import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MarkdownGFM({ file }: { file: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      className="prose prose-stone prose-lg prose-blockquote:bg-orange-200 prose-blockquote:w-fit min-w-full"
      children={file}
    />
  )
}
