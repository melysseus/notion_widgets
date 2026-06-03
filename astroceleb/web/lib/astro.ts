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

// ── display data for UI components ────────────────────────────────────────────

export type SignElement = 'fire' | 'earth' | 'air' | 'water'

export const SIGN_DATA = [
  { number: 1,  name: 'Aries',       symbol: '♈', element: 'fire'  as SignElement },
  { number: 2,  name: 'Taurus',      symbol: '♉', element: 'earth' as SignElement },
  { number: 3,  name: 'Gemini',      symbol: '♊', element: 'air'   as SignElement },
  { number: 4,  name: 'Cancer',      symbol: '♋', element: 'water' as SignElement },
  { number: 5,  name: 'Leo',         symbol: '♌', element: 'fire'  as SignElement },
  { number: 6,  name: 'Virgo',       symbol: '♍', element: 'earth' as SignElement },
  { number: 7,  name: 'Libra',       symbol: '♎', element: 'air'   as SignElement },
  { number: 8,  name: 'Scorpio',     symbol: '♏', element: 'water' as SignElement },
  { number: 9,  name: 'Sagittarius', symbol: '♐', element: 'fire'  as SignElement },
  { number: 10, name: 'Capricorn',   symbol: '♑', element: 'earth' as SignElement },
  { number: 11, name: 'Aquarius',    symbol: '♒', element: 'air'   as SignElement },
  { number: 12, name: 'Pisces',      symbol: '♓', element: 'water' as SignElement },
] as const

export function getSignData(n: number) {
  return SIGN_DATA.find(s => s.number === n) ?? null
}

export const PLANET_DISPLAY: Record<string, { label: string; symbol: string }> = {
  sun:     { label: 'Sun',     symbol: '☉' },
  moon:    { label: 'Moon',    symbol: '☽' },
  mercury: { label: 'Mercury', symbol: '☿' },
  venus:   { label: 'Venus',   symbol: '♀' },
  mars:    { label: 'Mars',    symbol: '♂' },
  jupiter: { label: 'Jupiter', symbol: '♃' },
  saturn:  { label: 'Saturn',  symbol: '♄' },
  rahu:    { label: 'Rahu',    symbol: '☊' },
  ketu:    { label: 'Ketu',    symbol: '☋' },
}

/** Format decimal degrees as "18°14'" */
export function formatDegree(decimal: number): string {
  const deg = Math.floor(decimal)
  const min = Math.round((decimal - deg) * 60)
  return `${deg}°${String(min).padStart(2, '0')}'`
}

/** Format "YYYY-MM-DD" as "September 4, 1981" */
export function formatBirthDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}
