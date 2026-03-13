'use client'

import { useEffect, useRef, useState } from 'react'

const DM_STEPS = [
  { number: 1, heading: 'Create your campaign', description: 'Set a planning window and share the link with your players.' },
  { number: 2, heading: 'Players mark their availability', description: 'Everyone sets their free days — you see it live on the calendar.' },
  { number: 3, heading: 'Add your unavailable dates', description: 'Block dates when you cannot run a session in the Settings tab.' },
  { number: 4, heading: 'Pick the best day', description: 'The ranked list shows which days work for everyone — copy it to your group chat.' },
]

const PLAYER_STEPS = [
  { number: 1, heading: 'Open the link', description: 'Your DM shares a link — enter your name to get started.' },
  { number: 2, heading: 'Set your weekly pattern', description: 'Tick the days you are usually free each week.' },
  { number: 3, heading: 'Add exceptions', description: 'Override specific dates if a particular week is different.' },
]

interface HowItWorksModalProps {
  onClose: () => void
  defaultRole?: 'dm' | 'player'
}

export function HowItWorksModal({ onClose, defaultRole }: HowItWorksModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const [role, setRole] = useState<'dm' | 'player'>(defaultRole ?? 'dm')

  useEffect(() => {
    ref.current?.showModal()
  }, [])

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) onClose()
  }

  const steps = role === 'dm' ? DM_STEPS : PLAYER_STEPS

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={handleBackdropClick}
      aria-labelledby="how-it-works-title"
      className="bg-[var(--dnd-input-bg)] border border-[#ba7df6]/30 rounded-lg p-0 max-w-lg w-full mx-4"
    >
      <div className="relative p-6 max-h-[90vh] overflow-y-auto">
        {/* Title row */}
        <h2 id="how-it-works-title" className="font-fantasy text-xl text-white mb-4 pr-8">
          How it works
        </h2>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--dnd-text-muted)] hover:text-white transition-colors"
        >
          ✕
        </button>

        {/* Role toggle */}
        <div className="flex gap-2 mb-5">
          <button
            type="button"
            onClick={() => setRole('dm')}
            className={`flex-1 py-1.5 text-sm rounded border transition-colors ${
              role === 'dm'
                ? 'border-[var(--dnd-accent)] text-white bg-[var(--dnd-accent)]/20'
                : 'border-[var(--dnd-border-muted)] text-[var(--dnd-text-muted)]'
            }`}
          >
            I&apos;m the DM
          </button>
          <button
            type="button"
            onClick={() => setRole('player')}
            className={`flex-1 py-1.5 text-sm rounded border transition-colors ${
              role === 'player'
                ? 'border-[var(--dnd-accent)] text-white bg-[var(--dnd-accent)]/20'
                : 'border-[var(--dnd-border-muted)] text-[var(--dnd-text-muted)]'
            }`}
          >
            I&apos;m a player
          </button>
        </div>

        {/* Step cards */}
        <div className="space-y-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="flex items-start gap-4 bg-[var(--dnd-card-bg)] border border-[var(--dnd-border-card)] rounded-lg px-4 py-3"
            >
              <span className="w-7 h-7 rounded-full bg-[var(--dnd-accent)] text-black flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                {step.number}
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{step.heading}</p>
                <p className="text-sm text-[var(--dnd-text-muted)] mt-0.5">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Got it button */}
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full py-2 rounded border border-[var(--dnd-border-muted)] text-sm text-[var(--dnd-text-muted)] hover:text-white transition-colors"
        >
          Got it
        </button>
      </div>
    </dialog>
  )
}
