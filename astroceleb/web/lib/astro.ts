// Vedic sign and planet constants shared across the API layer.

export const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const

// Canonical planet order for display
export const PLANET_KEYS = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'rahu', 'ketu',
] as const

export type PlanetKey = typeof PLANET_KEYS[number]

// lowercase sign name → number (Aries=1 … Pisces=12)
export const SIGN_MAP: Record<string, number> = Object.fromEntries(
  SIGN_NAMES.map((n, i) => [n.toLowerCase(), i + 1]),
)

export function signName(n: number): string {
  return SIGN_NAMES[n - 1] ?? 'Unknown'
}

/** Parse a sign name string to its number, or return null if unrecognised. */
export function parseSign(raw: string): number | null {
  return SIGN_MAP[raw.toLowerCase().trim()] ?? null
}

/**
 * Extract planet=sign filter pairs from URLSearchParams.
 * Silently drops unknown planets and unrecognised sign names.
 *
 * e.g. ?sun=leo&moon=virgo  →  [{planet:'sun',sign:5},{planet:'moon',sign:6}]
 */
export function parsePlanetFilters(
  params: URLSearchParams,
): Array<{ planet: string; sign: number }> {
  const filters: Array<{ planet: string; sign: number }> = []
  for (const planet of PLANET_KEYS) {
    const raw = params.get(planet)
    if (!raw) continue
    const sign = parseSign(raw)
    if (sign != null) filters.push({ planet, sign })
  }
  return filters
}

/** Sort a placements array into canonical Vedic planet order. */
export function sortPlacements<T extends { planet: string }>(placements: T[]): T[] {
  const order = Object.fromEntries(PLANET_KEYS.map((p, i) => [p, i]))
  return [...placements].sort(
    (a, b) => (order[a.planet] ?? 99) - (order[b.planet] ?? 99),
  )
}
