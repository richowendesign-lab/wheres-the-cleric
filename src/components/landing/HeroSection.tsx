'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useInView } from '@/hooks/useInView'
import { useScrollInView } from '@/hooks/useScrollInView'
import { HeroDemoWidget } from '@/components/landing/HeroDemoWidget'

export function HeroSection() {
  const { ref, inView } = useInView({ threshold: 0 })
  const { ref: zoomRef, progress } = useScrollInView<HTMLDivElement>()

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      className={[
        'flex flex-col items-center justify-center text-center px-8 py-16 gap-6',
        'transition-all duration-700 ease-out motion-reduce:transition-none',
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6',
      ].join(' ')}
    >
      <Image src="/dnd-icon.png" alt="" width={82} height={82} />
      <h1 className="font-fantasy text-5xl text-white max-w-2xl">schedule your next D&D Session</h1>
      <p className="text-white text-base max-w-lg">Beat the final boss - scheduling - and coordinate your group&apos;s availability without the back-and-forth.</p>
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
      <div
        ref={zoomRef}
        className="mt-24 w-full max-w-[800px] relative z-10 motion-reduce:!transform-none"
        style={{
          transform: `scale(${1 + progress * 0.5})`,
          opacity: 0.5 + progress * 0.5,
        }}
      >
        <HeroDemoWidget />
      </div>
    </section>
  )
}
