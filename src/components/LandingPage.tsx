'use client'
import { StickyNav } from './landing/StickyNav'
import { HeroSection } from './landing/HeroSection'
import { FeaturesBlock } from './landing/FeaturesBlock'
import { PlayersSection } from './landing/PlayersSection'
import { FaqSection } from './landing/FaqSection'
import { CtaSection } from './landing/CtaSection'
import { Footer } from './landing/Footer'

export function LandingPage() {
  return (
    <div className="overflow-x-clip">
      <StickyNav />
      <HeroSection />
      <FeaturesBlock />
      <PlayersSection />
      <FaqSection />
      <CtaSection />
      <Footer />
    </div>
  )
}
