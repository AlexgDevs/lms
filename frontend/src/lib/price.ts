/**
 * Price is stored in kopeks (int) in DB to avoid floating errors.
 * UI works in rubles. Helpers convert between them.
 */

export function kopeksToRub(priceKopeks: number | null | undefined): number {
  if (priceKopeks == null) return 0
  return priceKopeks / 100
}

export function rubToKopeks(priceRub: number | null | undefined): number {
  if (priceRub == null) return 0
  return Math.round(priceRub * 100)
}

export function formatPrice(priceKopeks: number | null | undefined): string {
  if (priceKopeks == null || priceKopeks === 0) return "0"
  return kopeksToRub(priceKopeks).toLocaleString("ru-RU")
}
