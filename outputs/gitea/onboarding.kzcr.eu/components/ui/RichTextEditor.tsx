'use client'

import { useRef, useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Bold, Italic, List, ListOrdered, Smile } from 'lucide-react'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false })

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
  const isInternalUpdate = useRef(false)

  const editor = useEditor({
    extensions: [StarterKit],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[100px] px-3 py-2',
      },
    },
    onUpdate: ({ editor }) => {
      isInternalUpdate.current = true
      const html = editor.getHTML()
      onChange(html === '<p></p>' ? '' : html)
    },
  })

  useEffect(() => {
    if (!editor) return
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false
      return
    }
    const currentHtml = editor.getHTML()
    const normalizedCurrent = currentHtml === '<p></p>' ? '' : currentHtml
    if (value !== normalizedCurrent) {
      editor.commands.setContent(value || '')
    }
  }, [value, editor])

  if (!editor) return null

  return (
    <div className={cn('border rounded-md overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-1 border-b bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-7 w-7 p-0', editor.isActive('bold') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleBold().run()}
          title="Tučné"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-7 w-7 p-0', editor.isActive('italic') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          title="Kurzíva"
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-7 w-7 p-0', editor.isActive('bulletList') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          title="Seznam"
        >
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn('h-7 w-7 p-0', editor.isActive('orderedList') && 'bg-muted')}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          title="Číslovaný seznam"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              title="Emoji"
            >
              <Smile className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 border-0" align="start">
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                editor.chain().focus().insertContent(emojiData.emoji).run()
              }}
              lazyLoadEmojis
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Editor */}
      <div className="relative">
        <EditorContent editor={editor} />
        {!value && placeholder && (
          <div className="pointer-events-none absolute top-0 left-0 text-muted-foreground text-sm px-3 py-2">
            {placeholder}
          </div>
        )}
      </div>
    </div>
  )
}
