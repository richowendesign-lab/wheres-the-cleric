'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useInView } from '@/hooks/useInView'

export function CtaSection() {
  const { ref, inView } = useInView({ threshold: 0.15 })

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
      <h2 className="font-fantasy text-4xl text-white">Ready to plan your next adventure?</h2>
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
    </section>
  )
}
