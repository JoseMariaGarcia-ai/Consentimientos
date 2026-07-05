import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, List, ListOrdered, Heading2, Undo, Redo } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Props {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  readOnly?: boolean
}

export function ConsentEditor({ content, onChange, placeholder, readOnly = false }: Props) {
  const { t } = useTranslation()
  const effectivePlaceholder = placeholder ?? t('consentEditor.placeholder_default')
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: effectivePlaceholder }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  if (!editor) return null

  const btn = (active: boolean, onClick: () => void, title: string, children: React.ReactNode) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-colors ${active ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'}`}
    >
      {children}
    </button>
  )

  return (
    <div className="border border-slate-300 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
      {!readOnly && (
        <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-200 bg-slate-50 flex-wrap">
          {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), t('consentEditor.bold'), <Bold className="w-4 h-4" />)}
          {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), t('consentEditor.italic'), <Italic className="w-4 h-4" />)}
          <div className="w-px h-5 bg-slate-200 mx-1" />
          {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), t('consentEditor.heading'), <Heading2 className="w-4 h-4" />)}
          <div className="w-px h-5 bg-slate-200 mx-1" />
          {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), t('consentEditor.bullet_list'), <List className="w-4 h-4" />)}
          {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), t('consentEditor.ordered_list'), <ListOrdered className="w-4 h-4" />)}
          <div className="w-px h-5 bg-slate-200 mx-1" />
          {btn(false, () => editor.chain().focus().undo().run(), t('consentEditor.undo'), <Undo className="w-4 h-4" />)}
          {btn(false, () => editor.chain().focus().redo().run(), t('consentEditor.redo'), <Redo className="w-4 h-4" />)}
        </div>
      )}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none px-4 py-3 min-h-[200px] text-slate-800 focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-slate-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none"
      />
    </div>
  )
}
