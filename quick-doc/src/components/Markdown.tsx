import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MarkdownGFM({ file }: { file: string }) {
  return (
    <div className="prose prose-stone prose-lg prose-blockquote:bg-orange-200 prose-blockquote:w-fit min-w-full">
      <Markdown remarkPlugins={[remarkGfm]}>{file}</Markdown>
    </div>
  )
}
