import { useEffect, useState } from "react"

export const TGP_GENERATION_COOLDOWN_HOURS = 24
export const TGP_SUBMIT_COOLDOWN_HOURS = 24
export const TGP_QUESTION_REGENERATION_COOLDOWN_HOURS = 1

export function getCooldownEnd(
  anchor: string | number | Date | null | undefined,
  cooldownHours: number,
): Date | null {
  if (!anchor) return null
  const time = new Date(anchor).getTime()
  if (Number.isNaN(time)) return null
  return new Date(time + cooldownHours * 60 * 60 * 1000)
}

export function getRemainingMs(end: Date | null): number {
  if (!end) return 0
  const ms = end.getTime() - Date.now()
  return ms > 0 ? ms : 0
}

export function formatCooldown(ms: number): string {
  if (ms <= 0) return ""
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours >= 1) return `${hours} ч ${minutes} мин`
  if (minutes >= 1) return `${minutes} мин ${seconds} с`
  return `${seconds} с`
}

/**
 * Returns the number of milliseconds remaining until `target`, ticking once per
 * second while the cooldown is active (and resetting to 0 once it expires).
 */
export function useCountdown(target: Date | null, enabled = true): number {
  const endTime = target ? target.getTime() : null
  const [remaining, setRemaining] = useState<number>(() =>
    endTime != null && enabled ? Math.max(endTime - Date.now(), 0) : 0,
  )

  useEffect(() => {
    if (!enabled || endTime == null) return

    const tick = () => {
      const ms = Math.max(endTime - Date.now(), 0)
      setRemaining(ms)
      if (ms <= 0) clearInterval(id)
    }

    const id = setInterval(tick, 1000)
    const immediate = setTimeout(tick, 0)
    return () => {
      clearInterval(id)
      clearTimeout(immediate)
    }
  }, [endTime, enabled])

  return remaining
}
