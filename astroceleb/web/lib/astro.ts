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

// ── nakshatras ────────────────────────────────────────────────────────────────
// 27 lunar mansions, each spanning 360/27 = 13°20'.

export const NAKSHATRA_DATA = [
  { number: 1,  name: 'Ashwini',           slug: 'ashwini' },
  { number: 2,  name: 'Bharani',           slug: 'bharani' },
  { number: 3,  name: 'Krittika',          slug: 'krittika' },
  { number: 4,  name: 'Rohini',            slug: 'rohini' },
  { number: 5,  name: 'Mrigashira',        slug: 'mrigashira' },
  { number: 6,  name: 'Ardra',             slug: 'ardra' },
  { number: 7,  name: 'Punarvasu',         slug: 'punarvasu' },
  { number: 8,  name: 'Pushya',            slug: 'pushya' },
  { number: 9,  name: 'Ashlesha',          slug: 'ashlesha' },
  { number: 10, name: 'Magha',             slug: 'magha' },
  { number: 11, name: 'Purva Phalguni',    slug: 'purva-phalguni' },
  { number: 12, name: 'Uttara Phalguni',   slug: 'uttara-phalguni' },
  { number: 13, name: 'Hasta',             slug: 'hasta' },
  { number: 14, name: 'Chitra',            slug: 'chitra' },
  { number: 15, name: 'Swati',             slug: 'swati' },
  { number: 16, name: 'Vishakha',          slug: 'vishakha' },
  { number: 17, name: 'Anuradha',          slug: 'anuradha' },
  { number: 18, name: 'Jyeshtha',          slug: 'jyeshtha' },
  { number: 19, name: 'Mula',              slug: 'mula' },
  { number: 20, name: 'Purva Ashadha',     slug: 'purva-ashadha' },
  { number: 21, name: 'Uttara Ashadha',    slug: 'uttara-ashadha' },
  { number: 22, name: 'Shravana',          slug: 'shravana' },
  { number: 23, name: 'Dhanishtha',        slug: 'dhanishtha' },
  { number: 24, name: 'Shatabhisha',       slug: 'shatabhisha' },
  { number: 25, name: 'Purva Bhadrapada',  slug: 'purva-bhadrapada' },
  { number: 26, name: 'Uttara Bhadrapada', slug: 'uttara-bhadrapada' },
  { number: 27, name: 'Revati',            slug: 'revati' },
] as const

export type NakshatraData = typeof NAKSHATRA_DATA[number]

/** slug → nakshatra number (1–27) */
export const NAKSHATRA_MAP: Record<string, number> = Object.fromEntries(
  NAKSHATRA_DATA.map(n => [n.slug, n.number]),
)

export function parseNakshatra(raw: string): number | null {
  return NAKSHATRA_MAP[raw.toLowerCase().trim()] ?? null
}

export function getNakshatraData(n: number): NakshatraData | null {
  return NAKSHATRA_DATA.find(nd => nd.number === n) ?? null
}

// ── professions ───────────────────────────────────────────────────────────────

export const PROFESSIONS = [
  'actor', 'musician', 'athlete', 'politician', 'director',
  'model', 'comedian', 'author', 'entrepreneur', 'artist',
] as const

export type Profession = typeof PROFESSIONS[number]
