import { useEffect, useRef, useState } from "react"

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  )
}

/**
 * Animates 0 → `target` with an ease-out curve once `active` turns true.
 * Later `target` updates (polling) animate from the currently shown value.
 */
export function useCountUp(target: number, active: boolean, duration = 1200): number {
  const [value, setValue] = useState(0)
  const frameRef = useRef<number | null>(null)
  const currentRef = useRef(0)

  useEffect(() => {
    if (!active) return

    if (prefersReducedMotion()) {
      currentRef.current = target
      frameRef.current = requestAnimationFrame(() => setValue(target))
      return () => {
        if (frameRef.current !== null) {
          cancelAnimationFrame(frameRef.current)
        }
      }
    }

    const from = currentRef.current
    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      const next = Math.round(from + (target - from) * eased)
      currentRef.current = next
      setValue(next)
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick)
      }
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [active, target, duration])

  return value
}
