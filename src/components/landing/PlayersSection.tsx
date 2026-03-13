'use client'

import { useInView } from '@/hooks/useInView'

function ShareIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function PartyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.8 11.3 2 22l10.7-3.79" />
      <path d="M4 3h.01" />
      <path d="M22 8h.01" />
      <path d="M15 2h.01" />
      <path d="M22 20h.01" />
      <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" />
      <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17" />
      <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.91 9 5.52 9 6.23V7" />
      <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2z" />
    </svg>
  )
}

export function PlayersSection() {
  const { ref, inView } = useInView({ threshold: 0.1 })

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={[
        'px-8 py-16 max-w-[800px] mx-auto w-full',
        'transition-all duration-700 ease-out motion-reduce:transition-none',
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
      ].join(' ')}
    >
      <h2 className="font-fantasy text-3xl text-white text-center mb-10">Easy for players</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <div className="group bg-[var(--dnd-card-bg)] border border-[var(--dnd-border-card)] rounded-lg p-4">
          <div className="text-[var(--dnd-accent)] mb-3 transition-transform duration-200 group-hover:scale-110 group-hover:-rotate-12 w-fit">
            <ShareIcon />
          </div>
          <h3 className="font-semibold text-white mb-2">Your DM will share a link with you</h3>
          <p className="text-[var(--dnd-text-muted)] text-sm">Fill in your name and you&apos;re ready to go.</p>
        </div>
        <div className="group bg-[var(--dnd-card-bg)] border border-[var(--dnd-border-card)] rounded-lg p-4">
          <div className="text-[var(--dnd-accent)] mb-3 transition-transform duration-200 group-hover:scale-110 group-hover:-translate-y-1 w-fit">
            <CalendarIcon />
          </div>
          <h3 className="font-semibold text-white mb-2">Input what days you are free to play</h3>
          <p className="text-[var(--dnd-text-muted)] text-sm">You&apos;ll be able to select any day in the planning window</p>
        </div>
        <div className="group bg-[var(--dnd-card-bg)] border border-[var(--dnd-border-card)] rounded-lg p-4">
          <div className="text-[var(--dnd-accent)] mb-3 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-12 w-fit">
            <PartyIcon />
          </div>
          <h3 className="font-semibold text-white mb-2">That&apos;s literally it - you don&apos;t even need to save</h3>
          <p className="text-[var(--dnd-text-muted)] text-sm">Your availability will show on your DM&apos;s dashboard</p>
        </div>
      </div>
      <div className="rounded-xl overflow-hidden shadow-[0px_3px_12px_1px_rgba(253,253,253,0.25)] w-full">
        <img src="/players-screenshot.png" alt="Player availability view" className="w-full h-auto" />
      </div>
    </section>
  )
}
