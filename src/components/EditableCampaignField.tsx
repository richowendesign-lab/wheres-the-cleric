'use client'
import { useState, useRef, useEffect } from 'react'

interface Props {
  campaignId: string
  value: string | null
  onSave: (id: string, val: string) => Promise<{ error?: string; success?: boolean } | undefined>
  variant: 'title' | 'description'
  placeholder?: string
  emptyLabel?: string
}

export function EditableCampaignField({ campaignId, value, onSave, variant, placeholder, emptyLabel = 'Add a description…' }: Props) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  useEffect(() => { if (editing && ref.current) { ref.current.focus(); const l = ref.current.value.length; ref.current.setSelectionRange(l, l) } }, [editing])

  function start() { setDraft(value ?? ''); setError(null); setEditing(true) }
  function cancel() { setEditing(false); setError(null) }
  async function save() {
    if (saving) return; setSaving(true); setError(null)
    try { const r = await onSave(campaignId, draft); if (r?.error) setError(r.error); else setEditing(false) }
    catch { setError('Something went wrong.') }
    finally { setSaving(false) }
  }
  function onKey(e: React.KeyboardEvent) { if (e.key === 'Escape') cancel(); if (e.key === 'Enter' && variant === 'title') { e.preventDefault(); save() } }

  const pencil = (
    <button onClick={start} aria-label="Edit"
      className="opacity-0 group-hover:opacity-100 focus:opacity-100 ml-2 p-1 rounded text-[var(--dnd-text-muted)] hover:text-white transition-opacity shrink-0">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M11.013 1.427a1.75 1.75 0 0 1 2.475 0l1.085 1.086a1.75 1.75 0 0 1 0 2.474L5.91 13.65a.75.75 0 0 1-.364.194l-3.75.833a.75.75 0 0 1-.906-.906l.833-3.75a.75.75 0 0 1 .194-.364L11.013 1.427Zm1.414 1.06a.25.25 0 0 0-.353 0L3.51 11.05l-.585 2.635 2.634-.586 8.573-8.573a.25.25 0 0 0 0-.354L12.427 2.487Z" fill="currentColor"/>
      </svg>
    </button>
  )
  const actions = (
    <div className="flex items-center gap-3">
      <button onClick={save} disabled={saving} className="text-sm bg-[var(--dnd-accent)] text-black font-semibold px-3 py-1 rounded hover:bg-[var(--dnd-accent-hover)] transition-colors disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
      <button onClick={cancel} className="text-sm text-[var(--dnd-text-muted)] hover:text-white transition-colors">Cancel</button>
    </div>
  )

  if (variant === 'title') {
    if (editing) return (
      <div className="flex flex-col gap-2">
        <input ref={ref as React.RefObject<HTMLInputElement>} type="text" value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={onKey} maxLength={100} placeholder={placeholder}
          className="font-fantasy text-3xl text-white bg-transparent border-b border-[var(--dnd-accent)] focus:outline-none w-full pb-1" />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {actions}
      </div>
    )
    return (
      <div className="group flex items-center min-w-0">
        <h1 className="font-fantasy text-3xl text-white truncate max-w-xl">{value ?? 'Campaign Dashboard'}</h1>
        {pencil}
      </div>
    )
  }

  if (editing) return (
    <div className="flex flex-col gap-2">
      <textarea ref={ref as React.RefObject<HTMLTextAreaElement>} value={draft} onChange={e => setDraft(e.target.value)} onKeyDown={onKey} maxLength={500} rows={3} placeholder={placeholder}
        className="w-full rounded bg-[var(--dnd-input-bg)] border border-[var(--dnd-accent)] px-3 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none resize-none" />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {actions}
    </div>
  )
  return (
    <div className="group flex items-start min-w-0">
      {value ? <p className="text-gray-400 text-sm leading-relaxed">{value}</p> : <p className="text-[var(--dnd-text-muted)] text-sm italic">{emptyLabel}</p>}
      {pencil}
    </div>
  )
}
