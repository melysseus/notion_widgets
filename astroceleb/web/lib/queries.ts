import { getSupabaseClient } from './supabase'
import {
  signName, sortPlacements, PLANET_KEYS, parseSign,
  parseNakshatra, getNakshatraData,
} from './astro'
import type { CelebrityListItem, CelebrityProfile, Placement } from '../types'

// URL param keys that carry nakshatra filters, e.g. "moon_nak", "asc_nak"
const NAK_SUFFIX = '_nak'

export interface SearchParams {
  q?: string | null
  asc?: string | null        // ascendant sign filter
  asc_nak?: string | null    // ascendant nakshatra filter
  profession?: string | null
  limit?: number
  offset?: number
  [key: string]: string | number | null | undefined
}

export async function searchCelebrities(params: SearchParams = {}): Promise<{
  celebrities: CelebrityListItem[]
  count: number
}> {
  const supabase = getSupabaseClient()

  // Planet-in-sign filters: ?moon=virgo → [{planet:'moon', sign:6}]
  const planetFilters = PLANET_KEYS.flatMap(planet => {
    const raw = params[planet]
    if (!raw || typeof raw !== 'string') return []
    const sign = parseSign(raw)
    return sign != null ? [{ planet, sign }] : []
  })

  // Planet-in-nakshatra filters: ?moon_nak=shravana → [{planet:'moon', nakshatra:22}]
  const nakshatraFilters = PLANET_KEYS.flatMap(planet => {
    const raw = params[`${planet}${NAK_SUFFIX}`]
    if (!raw || typeof raw !== 'string') return []
    const nakshatra = parseNakshatra(raw)
    return nakshatra != null ? [{ planet, nakshatra }] : []
  })

  const ascFilter    = params.asc     ? parseSign(params.asc as string)         : null
  const ascNakFilter = params.asc_nak ? parseNakshatra(params.asc_nak as string) : null

  const { data, error } = await supabase.rpc('search_celebrities', {
    name_query:                 params.q ?? null,
    planet_filters:             planetFilters,
    nakshatra_filters:          nakshatraFilters,
    ascendant_filter:           ascFilter,
    ascendant_nakshatra_filter: ascNakFilter,
    profession:                 params.profession ?? null,
    lim:                        params.limit ?? 20,
    off:                        params.offset ?? 0,
  })

  if (error) throw new Error(`Search query failed: ${error.message}`)

  const rows = (data ?? []) as any[]

  return {
    celebrities: rows.map(row => ({
      id:               row.id,
      name:             row.name,
      slug:             row.slug,
      birth_date:       row.birth_date,
      birth_time_known: row.birth_time_known,
      rodden_rating:    row.rodden_rating ?? null,
      professions:      row.professions ?? [],
      image_url:        row.image_url ?? null,
      sun_sign:         row.sun_sign ?? null,
      moon_sign:        row.moon_sign ?? null,
      ascendant:        row.ascendant_sign
        ? { sign: row.ascendant_sign, sign_name: signName(row.ascendant_sign) }
        : null,
    })) satisfies CelebrityListItem[],
    count: rows.length > 0 ? Number(rows[0].total_count) : 0,
  }
}

export async function getCelebrity(slug: string): Promise<CelebrityProfile | null> {
  const supabase = getSupabaseClient()

  const { data: celebrity, error: e1 } = await supabase
    .from('celebrities')
    .select('*')
    .eq('slug', slug)
    .single()

  if (e1 || !celebrity) return null

  const { data: chart, error: e2 } = await supabase
    .from('charts')
    .select('*')
    .eq('celebrity_id', celebrity.id)
    .eq('ayanamsa', 'lahiri')
    .eq('house_system', 'whole_sign')
    .single()

  if (e2 || !chart) return null

  const { data: rawPlacements } = await supabase
    .from('placements')
    .select('*')
    .eq('chart_id', chart.id)

  const placements: Placement[] = sortPlacements(
    (rawPlacements ?? []).map(p => ({
      ...p,
      sign_name:     signName(p.sign),
      nakshatra_name: p.nakshatra ? (getNakshatraData(p.nakshatra)?.name ?? null) : null,
    })),
  )

  const sunSign  = placements.find(p => p.planet === 'sun')?.sign  ?? null
  const moonSign = placements.find(p => p.planet === 'moon')?.sign ?? null

  return {
    id:               celebrity.id,
    name:             celebrity.name,
    slug:             celebrity.slug,
    birth_date:       celebrity.birth_date,
    birth_time:       celebrity.birth_time ?? null,
    birth_time_known: celebrity.birth_time_known,
    rodden_rating:    celebrity.rodden_rating ?? null,
    birth_place:      celebrity.birth_place ?? null,
    professions:      celebrity.professions ?? [],
    image_url:        celebrity.image_url ?? null,
    notes:            celebrity.notes ?? null,
    sun_sign:         sunSign,
    moon_sign:        moonSign,
    ascendant:        chart.ascendant_sign
      ? { sign: chart.ascendant_sign, sign_name: signName(chart.ascendant_sign) }
      : null,
    chart: {
      ascendant: chart.ascendant_sign ? {
        sign:           chart.ascendant_sign,
        sign_name:      signName(chart.ascendant_sign),
        degree:         chart.ascendant_degree ?? 0,
        nakshatra:      chart.ascendant_nakshatra ?? null,
        nakshatra_name: chart.ascendant_nakshatra
          ? (getNakshatraData(chart.ascendant_nakshatra)?.name ?? null)
          : null,
      } : null,
      placements,
    },
  }
}
