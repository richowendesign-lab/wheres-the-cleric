'use client'

import { useActionState } from 'react'

type ActionState = { error?: string } | undefined

interface JoinFormProps {
  action: (prevState: unknown, formData: FormData) => Promise<ActionState>
  campaignId: string
  joinToken: string
}

export default function JoinForm({ action, campaignId, joinToken }: JoinFormProps) {
  const [state, formAction] = useActionState(action, undefined)

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <input
          type="text"
          name="name"
          placeholder="Your name"
          autoFocus
          maxLength={50}
          required
          className="w-full rounded bg-[#200637] border border-[#ba7df6]/40 px-4 py-3 text-gray-400 placeholder-gray-500 focus:outline-none focus:border-[#ba7df6]"
        />
        {state?.error && (
          <p className="text-red-400 text-sm">{state.error}</p>
        )}
      </div>
      <input type="hidden" name="campaignId" value={campaignId} />
      <input type="hidden" name="joinToken" value={joinToken} />
      <button
        type="submit"
        className="w-full rounded bg-[#ba7df6] text-[#030712] font-semibold py-3 hover:bg-[#c994f8] transition-colors"
      >
        Join
      </button>
    </form>
  )
}
