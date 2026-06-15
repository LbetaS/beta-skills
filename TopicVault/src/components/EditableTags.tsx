import { Plus, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { normalizeTags } from '../lib/materialTags'

export type EditableTagsProps = {
  tags: string[]
  onChange: (nextTags: string[]) => void
  editable?: boolean
  addLabel?: string
  layout?: 'wrap' | 'vertical' | 'two-column'
  className?: string
}

export function EditableTags({
  tags,
  onChange,
  editable = true,
  addLabel = '添加标签',
  layout = 'wrap',
  className = '',
}: EditableTagsProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const normalizedTags = normalizeTags(tags)

  function commitDraft() {
    const nextTag = draft.trim()
    setDraft('')
    setIsAdding(false)

    if (!nextTag || normalizedTags.includes(nextTag)) {
      return
    }

    onChange([...normalizedTags, nextTag])
  }

  function cancelDraft() {
    setDraft('')
    setIsAdding(false)
  }

  function removeTag(tag: string) {
    onChange(normalizedTags.filter((item) => item !== tag))
  }

  function showInput() {
    setIsAdding(true)
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }

  const layoutClassName =
    layout === 'vertical'
      ? 'flex flex-col items-start gap-1.5'
      : layout === 'two-column'
        ? 'grid grid-cols-2 items-start gap-1.5'
        : 'flex flex-wrap items-center gap-2'

  return (
    <div className={`${layoutClassName} ${className}`}>
      {normalizedTags.map((tag) => (
        <span
          key={tag}
          className="group inline-flex min-h-8 items-center gap-1 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium text-zinc-300 transition hover:border-brand-green/50 hover:text-zinc-100"
        >
          {tag}
          {editable && (
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full text-zinc-600 transition hover:bg-red-400/15 hover:text-red-300 group-hover:text-zinc-400"
              aria-label={`删除标签 ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}

      {editable && isAdding && (
        <input
          ref={inputRef}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitDraft}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              commitDraft()
            }
            if (event.key === 'Escape') {
              event.preventDefault()
              cancelDraft()
            }
          }}
          placeholder="输入标签"
          className="h-8 min-w-0 w-28 rounded-full border border-brand-green/40 bg-black/35 px-3 text-xs text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-brand-green"
        />
      )}

      {editable && !isAdding && (
        <button
          type="button"
          onClick={showInput}
          className="inline-flex h-8 items-center gap-1 rounded-full border border-dashed border-brand-green/35 bg-brand-green/5 px-3 text-xs font-medium text-brand-green transition hover:border-brand-green/70 hover:bg-brand-green/10"
        >
          <Plus className="h-3.5 w-3.5" />
          {addLabel}
        </button>
      )}
    </div>
  )
}
