'use client'
import { StickyNav } from './landing/StickyNav'
import { HeroSection } from './landing/HeroSection'
import { FeaturesBlock } from './landing/FeaturesBlock'
import { PlayersSection } from './landing/PlayersSection'
import { CtaSection } from './landing/CtaSection'
import { Footer } from './landing/Footer'

export function LandingPage() {
  return (
    <div className="overflow-x-hidden">
      <StickyNav />
      <HeroSection />
      <FeaturesBlock />
      <PlayersSection />
      <CtaSection />
      <Footer />
    </div>
  )
}
