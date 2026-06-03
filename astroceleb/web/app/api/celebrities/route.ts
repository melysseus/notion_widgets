/**
 * GET /api/celebrities
 *
 * Query params:
 *   q          – partial name search
 *   sun|moon|mercury|venus|mars|jupiter|saturn|rahu|ketu
 *              – filter by sign, e.g. moon=virgo
 *   profession – filter by profession string, e.g. profession=actor
 *   limit      – max results (default 20, max 100)
 *   offset     – pagination offset (default 0)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { parsePlanetFilters, signName } from '@/lib/astro'
import type { CelebrityListItem, PaginatedResponse } from '@/types'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams

  const nameQuery   = p.get('q')           || null
  const profession  = p.get('profession')  || null
  const limit       = Math.min(parseInt(p.get('limit')  ?? '20'), 100)
  const offset      = Math.max(parseInt(p.get('offset') ?? '0'),  0)
  const filters     = parsePlanetFilters(p)

  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.rpc('search_celebrities', {
      name_query:     nameQuery,
      planet_filters: filters,
      profession:     profession,
      lim:            limit,
      off:            offset,
    })

    if (error) {
      console.error('[/api/celebrities] Supabase RPC error:', error)
      return NextResponse.json({ error: 'Database query failed' }, { status: 502 })
    }

    const rows = (data ?? []) as any[]
    const totalCount = rows.length > 0 ? Number(rows[0].total_count) : 0

    const celebrities: CelebrityListItem[] = rows.map((row) => ({
      id:              row.id,
      name:            row.name,
      slug:            row.slug,
      birth_date:      row.birth_date,
      birth_time_known: row.birth_time_known,
      rodden_rating:   row.rodden_rating ?? null,
      professions:     row.professions ?? [],
      image_url:       row.image_url ?? null,
      ascendant:       row.ascendant_sign
        ? { sign: row.ascendant_sign, sign_name: signName(row.ascendant_sign) }
        : null,
    }))

    const response: PaginatedResponse<CelebrityListItem> = {
      data:   celebrities,
      count:  totalCount,
      limit,
      offset,
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[/api/celebrities] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
