export function FeaturesBlock() {
  return (
    <section className="px-8 py-24 max-w-5xl mx-auto w-full">
      <h2 className="font-fantasy text-3xl text-white text-center mb-4">Simple scheduling for your next game</h2>
      <p className="text-[var(--dnd-text-muted)] text-center max-w-2xl mx-auto mb-12">No more manually creating polls. No more back and forth. Simply create a campaign, share the link, and let your players tell you when they&apos;re free, leaving you to focus on practicing your accents for that new NPC.</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left column: step cards */}
        <div className="flex flex-col gap-4">
          {/* Step 1 — ACTIVE */}
          <div className="flex items-start gap-4 bg-[var(--dnd-card-bg)] border border-[var(--dnd-border-card)] rounded-lg px-4 py-3">
            <span className="w-7 h-7 rounded-full bg-[#572182] text-white flex items-center justify-center text-sm font-bold shrink-0">1</span>
            <div>
              <p className="font-semibold text-white">Create and share your campaign</p>
              <p className="text-[var(--dnd-text-muted)] mt-1 text-sm">Fill in basic details, set a planning window and share the link with players</p>
            </div>
          </div>
          {/* Step 2 — INACTIVE */}
          <div className="flex items-start gap-4 bg-[var(--dnd-card-bg)] border border-[var(--dnd-border-card)] rounded-lg px-4 py-3 opacity-60">
            <span className="w-7 h-7 rounded-full bg-[#ba7df6] text-black flex items-center justify-center text-sm font-bold shrink-0">2</span>
            <div>
              <p className="font-semibold text-white">Players mark their availability</p>
            </div>
          </div>
          {/* Step 3 — INACTIVE */}
          <div className="flex items-start gap-4 bg-[var(--dnd-card-bg)] border border-[var(--dnd-border-card)] rounded-lg px-4 py-3 opacity-60">
            <span className="w-7 h-7 rounded-full bg-[#ba7df6] text-black flex items-center justify-center text-sm font-bold shrink-0">3</span>
            <div>
              <p className="font-semibold text-white">Add your unavailable dates</p>
            </div>
          </div>
          {/* Step 4 — INACTIVE */}
          <div className="flex items-start gap-4 bg-[var(--dnd-card-bg)] border border-[var(--dnd-border-card)] rounded-lg px-4 py-3 opacity-60">
            <span className="w-7 h-7 rounded-full bg-[#ba7df6] text-black flex items-center justify-center text-sm font-bold shrink-0">4</span>
            <div>
              <p className="font-semibold text-white">Pick the best day</p>
            </div>
          </div>
        </div>
        {/* Right column: step illustration */}
        <div className="flex justify-center">
          <img src="/features-step-1.png" alt="Step 1 illustration" width={308} height={308} className="w-[308px] h-[308px] object-contain mx-auto" />
        </div>
      </div>
    </section>
  )
}
