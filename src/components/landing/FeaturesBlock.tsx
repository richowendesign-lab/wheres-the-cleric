'use client'

import { useState } from 'react'
import { useInView } from '@/hooks/useInView'

const steps = [
  { id: 1, title: 'Create and share your campaign', description: 'Fill in basic details, set a planning window and share the link with players' },
  { id: 2, title: 'Players mark their availability', description: 'Everyone sets their free days — you see it live on the calendar.' },
  { id: 3, title: 'Add your unavailable dates', description: 'Block dates when you cannot run a session in the Settings tab.' },
  { id: 4, title: 'Pick the best day', description: 'The ranked list shows which days work for everyone - copy it to your group chat.' },
]

export function FeaturesBlock() {
  const [activeStep, setActiveStep] = useState(1)
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
      <h2 className="font-fantasy text-3xl text-white text-center mb-4">Simple scheduling for your next game</h2>
      <p className="text-white text-base text-center max-w-2xl mx-auto mb-10">No more manually creating polls. No more back and forth. Simply create a campaign, share the link, and let your players tell you when they&apos;re free, leaving you to focus on practicing your accents for that new NPC.</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left column: step cards */}
        <div className="flex flex-col gap-4">
          {steps.map((step) => {
            const isActive = activeStep === step.id
            return (
              <div
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                className="relative flex items-start gap-4 rounded-lg px-4 py-3 cursor-pointer overflow-hidden border border-[var(--dnd-border-card)]"
              >
                {/* Background dims on inactive, content stays full opacity */}
                <div className={[
                  'absolute inset-0 bg-[var(--dnd-card-bg)] transition-opacity duration-200',
                  isActive ? 'opacity-100' : 'opacity-60',
                ].join(' ')} />
                <span
                  className={[
                    'relative w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shrink-0',
                    isActive ? 'bg-[#572182] text-white' : 'bg-[#ba7df6] text-black',
                  ].join(' ')}
                >
                  {step.id}
                </span>
                <div className="relative">
                  <p className="font-semibold text-white">{step.title}</p>
                  {isActive && <p className="text-[var(--dnd-text-muted)] mt-1 text-sm">{step.description}</p>}
                </div>
              </div>
            )
          })}
        </div>
        {/* Right column: step illustration */}
        <div className="flex justify-center">
          <img src={`/features-step-${activeStep}.png`} alt={`Step ${activeStep} illustration`} width={308} height={308} className="w-[308px] h-[308px] object-contain mx-auto" />
        </div>
      </div>
    </section>
  )
}
