import Image from 'next/image'
import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="flex flex-col items-center justify-center text-center px-8 py-24 gap-6">
      <Image src="/dnd-icon.png" alt="" width={82} height={82} />
      <h1 className="font-fantasy text-5xl text-white max-w-2xl">schedule your next D&D Session</h1>
      <p className="text-[var(--dnd-text-muted)] text-lg max-w-lg">Beat the final boss - scheduling - and coordinate your group&apos;s availability without the back-and-forth.</p>
      <div className="flex gap-4">
        <Link
          href="/auth/signup"
          className="px-6 py-3 rounded bg-[var(--dnd-accent)] text-black font-semibold hover:bg-[var(--dnd-accent-hover)] transition-colors"
        >
          Sign up
        </Link>
        <Link
          href="/auth/login"
          className="px-6 py-3 rounded border border-[var(--dnd-accent)] text-[var(--dnd-accent)] font-semibold hover:bg-[#ba7df6]/10 transition-colors"
        >
          Log in
        </Link>
      </div>
      <div className="mt-12 rounded-xl overflow-hidden shadow-2xl border border-[#ba7df6]/20 max-w-[672px] w-full mx-auto">
        <img src="/hero-screenshot.png" alt="DM dashboard preview" width={672} height={329} className="w-full h-auto" />
      </div>
    </section>
  )
}
