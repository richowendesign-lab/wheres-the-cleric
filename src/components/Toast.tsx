'use client'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function Toast({
  status,
  onRetry,
  onDismiss,
}: {
  status: SaveStatus
  onRetry: () => void
  onDismiss: () => void
}) {
  const visible = status === 'saved' || status === 'error'
  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all duration-300 ${
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
    } ${status === 'saved' ? 'bg-green-800 text-green-100' : 'bg-red-900/90 text-red-100'}`}>
      {status === 'saved' && <span>Saved</span>}
      {status === 'error' && (
        <>
          <span>Couldn&apos;t save</span>
          <button className="underline hover:text-red-300 cursor-pointer" onClick={onRetry}>Retry</button>
          <button aria-label="Dismiss" className="ml-1 opacity-70 hover:opacity-100 cursor-pointer" onClick={onDismiss}>✕</button>
        </>
      )}
    </div>
  )
}
