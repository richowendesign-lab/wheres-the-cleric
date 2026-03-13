import { useRef, useState, useEffect } from 'react'

export function useScrollInView<T extends HTMLElement = HTMLElement>(
  options: { threshold?: number; rootMargin?: string } = {}
): { ref: React.RefObject<T | null>; inView: boolean } {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // No disconnect() here — toggling continuously is the whole point
          setInView(entry.isIntersecting)
        })
      },
      {
        threshold: options.threshold ?? 0.2,
        rootMargin: options.rootMargin ?? '0px',
      }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [options.threshold, options.rootMargin])

  return { ref, inView }
}
