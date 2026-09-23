import { useEffect, useRef, useState } from "react"

/**
 * Observes the element once it meaningfully enters the viewport.
 * `inView` latches to true and never flips back, so enter-animations
 * run a single time per page load.
 */
export function useInView<T extends HTMLElement>(threshold = 0.4) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { threshold },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [threshold, inView])

  return { ref, inView }
}
