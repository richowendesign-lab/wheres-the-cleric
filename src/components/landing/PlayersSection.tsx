export function PlayersSection() {
  return (
    <section className="px-8 py-24 max-w-5xl mx-auto w-full">
      <h2 className="font-fantasy text-3xl text-white text-center mb-12">Easy for players</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <div className="bg-[var(--dnd-card-bg)] border border-[var(--dnd-border-card)] rounded-lg p-6">
          <h3 className="font-semibold text-white mb-2">Your DM will share a link with you</h3>
          <p className="text-[var(--dnd-text-muted)] text-sm">Fill in your name and you&apos;re ready to go.</p>
        </div>
        <div className="bg-[var(--dnd-card-bg)] border border-[var(--dnd-border-card)] rounded-lg p-6">
          <h3 className="font-semibold text-white mb-2">Input what days you are free to play</h3>
          <p className="text-[var(--dnd-text-muted)] text-sm">You&apos;ll be able to select any day in the planning window</p>
        </div>
        <div className="bg-[var(--dnd-card-bg)] border border-[var(--dnd-border-card)] rounded-lg p-6">
          <h3 className="font-semibold text-white mb-2">That&apos;s literally it - you don&apos;t even need to save</h3>
          <p className="text-[var(--dnd-text-muted)] text-sm">Your availability will show on your DM&apos;s dashboard</p>
        </div>
      </div>
      <div className="rounded-xl overflow-hidden shadow-2xl border border-[#ba7df6]/20 max-w-[672px] w-full mx-auto">
        <img src="/players-screenshot.png" alt="Player availability view" width={672} height={329} className="w-full h-auto" />
      </div>
    </section>
  )
}
