---
plan: 23-02
phase: 23-availability-demo
status: complete
---

## Summary

Wired HeroDemoWidget into HeroSection (replacing static hero-screenshot.png) and PlayerDemoWidget into PlayersSection (replacing static players-screenshot.png). useScrollInView rewritten as progressive scroll-position hook returning 0-1 progress value. Both demos scale from 1.0 to 1.5 based on viewport center proximity, with opacity fading from 0.5 to 1.0. Human verified all interactions work — calendar clicks, day toggles, scroll zoom, and bidirectional scroll reversal. Phase 23 requirements HERO-02 and PLAY-02 satisfied.
