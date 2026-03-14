import { useRef, useState, useEffect, useCallback } from 'react'

/**
 * Returns a progress value (0–1) based on how centered the element is
 * in the viewport. 0 = element is at the edge/outside, 1 = element
 * center is at viewport center. The value interpolates smoothly as
 * the user scrolls in either direction.
 *
 * Also returns a maxScale that ensures the scaled element fits within
 * the viewport width with padding.
 */
export function useScrollInView<T extends HTMLElement = HTMLElement>(): {
  ref: React.RefObject<T | null>
  progress: number
  maxScale: number
} {
  const ref = useRef<T | null>(null)
  const [progress, setProgress] = useState(0)
  const [maxScale, setMaxScale] = useState(1.5)

  const update = useCallback(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const viewportH = window.innerHeight
    const viewportW = window.innerWidth
    const elementCenter = rect.top + rect.height / 2
    const viewportCenter = viewportH / 2

    // Distance from element center to viewport center, normalised to 0–1
    const maxDist = viewportH / 2 + rect.height / 2
    const dist = Math.abs(elementCenter - viewportCenter)
    const p = Math.max(0, Math.min(1, 1 - dist / maxDist))
    setProgress(p)

    // Cap scale so element fits viewport width with 32px padding
    const elementW = rect.width
    if (elementW > 0) {
      const availableW = viewportW - 32
      setMaxScale(Math.min(1.5, availableW / elementW))
    }
  }, [])

  useEffect(() => {
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [update])

  return { ref, progress, maxScale }
}
