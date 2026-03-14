'use client'

import { useState } from 'react'

const faqs = [
  {
    question: 'How much does it cost?',
    answer: 'Nothing! This is a completely free tool and always will be.',
  },
  {
    question: 'Do I need an account?',
    answer: 'As a DM you\'ll need to set up an account. This lets you manage multiple campaigns and keep track of your groups. Players don\'t need an account at all. They just need the link to your campaign.',
  },
  {
    question: 'Can I run multiple campaigns at once?',
    answer: 'Yes. Once you\'ve created an account you can set up as many campaigns as you need, each with its own planning window and player list.',
  },
  {
    question: 'How do my players access the campaign?',
    answer: 'When you create a campaign you\'ll get a shareable link. Send it to your players however you like. They enter their name, mark their free days and they\'re done.',
  },
  {
    question: 'What if a player changes their availability?',
    answer: 'Players can update their availability at any time by revisiting the same link. Your dashboard updates automatically so you always have the latest picture.',
  },
  {
    question: 'Do players need to download anything?',
    answer: 'No. Everything runs in the browser. No apps, no extensions, no sign-ups for players.',
  },
]

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={[
        'shrink-0 transition-transform duration-200',
        open ? 'rotate-180' : '',
      ].join(' ')}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  function toggle(index: number) {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="px-8 py-16 max-w-[800px] mx-auto w-full">
      <h2 className="font-fantasy text-3xl text-white text-center mb-10">Frequently asked questions</h2>
      <div className="flex flex-col gap-2">
        {faqs.map((faq, i) => (
          <div
            key={i}
            className="border border-[var(--dnd-border-card)] rounded-lg overflow-hidden"
          >
            <button
              onClick={() => toggle(i)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left bg-[rgba(20,3,38,0.8)] hover:bg-[var(--dnd-card-hover)] transition-colors"
            >
              <span className="font-semibold text-white">{faq.question}</span>
              <ChevronIcon open={openIndex === i} />
            </button>
            <div
              className={[
                'grid transition-all duration-200 ease-out',
                openIndex === i ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
              ].join(' ')}
            >
              <div className="overflow-hidden">
                <p className="px-5 py-4 text-white text-base border-t border-[var(--dnd-border-muted)] bg-[rgba(20,3,38,0.5)]">
                  {faq.answer}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
