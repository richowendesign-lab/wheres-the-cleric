'use client'
import { useActionState } from 'react'
type ActionState = { error?: string } | undefined
interface JoinFormProps { action: (prev: unknown, fd: FormData) => Promise<ActionState>; campaignId: string; joinToken: string }
export default function JoinForm({ action, campaignId, joinToken }: JoinFormProps) {
  const [state, formAction] = useActionState(action, undefined)
  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <input type="text" name="name" placeholder="Your name" autoFocus maxLength={50} required
          className="w-full rounded bg-[var(--dnd-input-bg)] border border-[#ba7df6]/40 px-4 py-3 text-gray-400 placeholder-gray-500 focus:outline-none focus:border-[var(--dnd-accent)]" />
        {state?.error && <p className="text-red-400 text-sm">{state.error}</p>}
      </div>
      <input type="hidden" name="campaignId" value={campaignId} />
      <input type="hidden" name="joinToken" value={joinToken} />
      <button type="submit" className="w-full rounded bg-[var(--dnd-accent)] text-black font-semibold py-3 hover:bg-[var(--dnd-accent-hover)] transition-colors">Join</button>
    </form>
  )
}
