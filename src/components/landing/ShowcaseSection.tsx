'use client'

function CampaignCardMini({ name, players, accent }: { name: string; players: number; accent?: boolean }) {
  return (
    <div className={[
      'flex items-center gap-3 rounded-lg px-4 py-3 border transition-colors',
      accent
        ? 'bg-[rgba(87,33,130,0.3)] border-[var(--dnd-accent)]'
        : 'bg-[var(--dnd-card-bg)] border-[var(--dnd-border-card)]',
    ].join(' ')}>
      <div className="flex-1 min-w-0">
        <p className={['text-sm font-semibold truncate', accent ? 'text-[var(--dnd-accent)]' : 'text-[var(--dnd-accent)]'].join(' ')}>{name}</p>
        <p className="text-xs text-[var(--dnd-text-muted)]">{players} {players === 1 ? 'player' : 'players'}</p>
      </div>
      <svg className="w-3 h-3 text-[var(--dnd-accent)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  )
}

function PulseRing() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
    </span>
  )
}

function UpdateLine({ name, delay }: { name: string; delay: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg px-4 py-3 bg-[var(--dnd-card-bg)] border border-[var(--dnd-border-card)] animate-fade-in-up"
      style={{ animationDelay: delay }}
    >
      <PulseRing />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white"><span className="font-semibold text-[var(--dnd-accent)]">{name}</span> submitted availability</p>
      </div>
      <span className="text-xs text-[var(--dnd-text-muted)] shrink-0">Just now</span>
    </div>
  )
}

export function ShowcaseSection() {
  return (
    <section className="px-8 py-10 max-w-[900px] mx-auto w-full">
      <h2 className="font-fantasy text-3xl text-white text-center mb-4">Built for Dungeon Masters</h2>
      <p className="text-white text-base text-center max-w-2xl mx-auto mb-10">Everything you need to keep your groups organised and your sessions on track.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Multiple campaigns */}
        <div className="bg-[rgba(20,3,38,0.6)] border border-[var(--dnd-border-card)] rounded-xl p-8 flex flex-col transition-all duration-300 hover:scale-[1.03] hover:border-[var(--dnd-accent)] hover:shadow-lg hover:shadow-[#ba7df6]/10">
          <h3 className="font-fantasy text-xl text-white mb-2">Run multiple campaigns</h3>
          <p className="text-[var(--dnd-text-muted)] text-sm mb-6">
            Whether you run one group or five, your dashboard keeps every campaign organised in one place. Switch between groups and track availability across all of them.
          </p>
          <div className="flex flex-col gap-2 mt-auto">
            <CampaignCardMini name="Curse of Strahd" players={5} accent />
            <CampaignCardMini name="Lost Mine of Phandelver" players={4} />
            <CampaignCardMini name="Tomb of Annihilation" players={6} />
          </div>
        </div>

        {/* Card 2: Real-time updates */}
        <div className="bg-[rgba(20,3,38,0.6)] border border-[var(--dnd-border-card)] rounded-xl p-8 flex flex-col transition-all duration-300 hover:scale-[1.03] hover:border-[var(--dnd-accent)] hover:shadow-lg hover:shadow-[#ba7df6]/10">
          <h3 className="font-fantasy text-xl text-white mb-2">Instant updates</h3>
          <p className="text-[var(--dnd-text-muted)] text-sm mb-6">
            The moment a player submits their availability, your dashboard updates. No refreshing, no chasing responses. Just share the link and watch the calendar fill in.
          </p>
          <div className="flex flex-col gap-2 mt-auto">
            <UpdateLine name="Aria" delay="0s" />
            <UpdateLine name="Brom" delay="0.3s" />
            <UpdateLine name="Cassandra" delay="0.6s" />
          </div>
        </div>
      </div>
    </section>
  )
}
