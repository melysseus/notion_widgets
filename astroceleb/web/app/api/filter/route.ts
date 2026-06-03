/**
 * GET /api/filter
 *
 * Dedicated filter endpoint — requires at least one planet or nakshatra filter.
 *
 * Query params:
 *   sun|moon|…   – planet in sign, e.g. moon=virgo
 *   moon_nak|…   – planet in nakshatra, e.g. moon_nak=shravana
 *   asc          – ascendant sign
 *   asc_nak      – ascendant nakshatra
 *   profession   – e.g. profession=actor
 *   limit        – default 20, max 100
 *   offset       – default 0
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { parsePlanetFilters, parseNakshatra, parseSign, signName, PLANET_KEYS } from '@/lib/astro'
import type { CelebrityListItem, FilterResponse } from '@/types'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams

  const planetFilters = parsePlanetFilters(p)

  const nakshatraFilters = PLANET_KEYS.flatMap(planet => {
    const raw = p.get(`${planet}_nak`)
    if (!raw) return []
    const nak = parseNakshatra(raw)
    return nak != null ? [{ planet, nakshatra: nak }] : []
  })

  const ascendantFilter          = p.get('asc')     ? parseSign(p.get('asc')!)         : null
  const ascendantNakshatraFilter = p.get('asc_nak') ? parseNakshatra(p.get('asc_nak')!) : null
  const profession               = p.get('profession') || null
  const limit                    = Math.min(parseInt(p.get('limit')  ?? '20'), 100)
  const offset                   = Math.max(parseInt(p.get('offset') ?? '0'),  0)

  const hasFilter =
    planetFilters.length > 0 ||
    nakshatraFilters.length > 0 ||
    ascendantFilter != null ||
    ascendantNakshatraFilter != null

  if (!hasFilter) {
    return NextResponse.json(
      { error: 'At least one filter is required.', example: '/api/filter?moon=virgo' },
      { status: 400 },
    )
  }

  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.rpc('search_celebrities', {
      name_query:                 null,
      planet_filters:             planetFilters,
      nakshatra_filters:          nakshatraFilters,
      ascendant_filter:           ascendantFilter,
      ascendant_nakshatra_filter: ascendantNakshatraFilter,
      profession,
      lim:                        limit,
      off:                        offset,
    })

    if (error) {
      console.error('[/api/filter] Supabase RPC error:', error)
      return NextResponse.json({ error: 'Database query failed' }, { status: 502 })
    }

    const rows = (data ?? []) as any[]
    const totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0

    const celebrities: CelebrityListItem[] = rows.map((row) => ({
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
    }))

    const response: FilterResponse = {
      data:           celebrities,
      count:          totalCount,
      limit,
      offset,
      active_filters: planetFilters.map((f) => ({
        planet:    f.planet,
        sign:      f.sign,
        sign_name: signName(f.sign),
      })),
    }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
    })
  } catch (err) {
    console.error('[/api/filter] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
