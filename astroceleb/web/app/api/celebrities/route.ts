/**
 * GET /api/celebrities
 *
 * Query params:
 *   q            – partial name search
 *   sun|moon|…   – planet in sign, e.g. moon=virgo
 *   moon_nak|…   – planet in nakshatra, e.g. moon_nak=shravana
 *   asc          – ascendant sign, e.g. asc=libra
 *   asc_nak      – ascendant nakshatra, e.g. asc_nak=swati
 *   profession   – e.g. profession=actor
 *   limit        – max results (default 20, max 100)
 *   offset       – pagination offset (default 0)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { parsePlanetFilters, parseNakshatra, parseSign, signName, PLANET_KEYS } from '@/lib/astro'
import type { CelebrityListItem, PaginatedResponse } from '@/types'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams

  const nameQuery  = p.get('q')           || null
  const profession = p.get('profession')  || null
  const limit      = Math.min(parseInt(p.get('limit')  ?? '20'), 100)
  const offset     = Math.max(parseInt(p.get('offset') ?? '0'),  0)

  const planetFilters = parsePlanetFilters(p)

  const nakshatraFilters = PLANET_KEYS.flatMap(planet => {
    const raw = p.get(`${planet}_nak`)
    if (!raw) return []
    const nak = parseNakshatra(raw)
    return nak != null ? [{ planet, nakshatra: nak }] : []
  })

  const ascendantFilter        = p.get('asc')     ? parseSign(p.get('asc')!)         : null
  const ascendantNakshatraFilter = p.get('asc_nak') ? parseNakshatra(p.get('asc_nak')!) : null

  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.rpc('search_celebrities', {
      name_query:                 nameQuery,
      planet_filters:             planetFilters,
      nakshatra_filters:          nakshatraFilters,
      ascendant_filter:           ascendantFilter,
      ascendant_nakshatra_filter: ascendantNakshatraFilter,
      profession,
      lim:                        limit,
      off:                        offset,
    })

    if (error) {
      console.error('[/api/celebrities] Supabase RPC error:', error)
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

    const response: PaginatedResponse<CelebrityListItem> = { data: celebrities, count: totalCount, limit, offset }

    return NextResponse.json(response, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600' },
    })
  } catch (err) {
    console.error('[/api/celebrities] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
