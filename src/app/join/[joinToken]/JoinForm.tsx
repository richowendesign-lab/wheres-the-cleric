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
          className="w-full rounded bg-gray-800 border border-gray-700 px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-amber-500"
        />
        {state?.error && (
          <p className="text-red-400 text-sm">{state.error}</p>
        )}
      </div>
      <input type="hidden" name="campaignId" value={campaignId} />
      <input type="hidden" name="joinToken" value={joinToken} />
      <button
        type="submit"
        className="w-full rounded bg-amber-500 text-gray-950 font-semibold py-3 hover:bg-amber-400 transition-colors"
      >
        Join
      </button>
    </form>
  )
}
