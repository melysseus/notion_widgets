/**
 * GET /api/filter
 *
 * Dedicated planetary placement filter endpoint.
 * At least one planet=sign param is required.
 *
 * Query params:
 *   sun|moon|mercury|venus|mars|jupiter|saturn|rahu|ketu
 *              – sign filter, e.g. moon=virgo&mars=scorpio
 *   profession – narrow by profession, e.g. profession=actor
 *   limit      – default 20, max 100
 *   offset     – pagination offset, default 0
 *
 * Response includes active_filters[] so the UI can render the active chip labels
 * without re-parsing the URL.
 *
 * Example:
 *   GET /api/filter?sun=leo&moon=virgo
 *   GET /api/filter?mars=scorpio&profession=actor
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { parsePlanetFilters, signName } from '@/lib/astro'
import type { CelebrityListItem, FilterResponse } from '@/types'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams

  const filters    = parsePlanetFilters(p)
  const profession = p.get('profession') || null
  const limit      = Math.min(parseInt(p.get('limit')  ?? '20'), 100)
  const offset     = Math.max(parseInt(p.get('offset') ?? '0'),  0)

  if (filters.length === 0) {
    return NextResponse.json(
      {
        error:   'At least one planet filter is required.',
        example: '/api/filter?moon=virgo',
        planets: ['sun','moon','mercury','venus','mars','jupiter','saturn','rahu','ketu'],
      },
      { status: 400 },
    )
  }

  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase.rpc('search_celebrities', {
      name_query:     null,
      planet_filters: filters,
      profession:     profession,
      lim:            limit,
      off:            offset,
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
      ascendant:        row.ascendant_sign
        ? { sign: row.ascendant_sign, sign_name: signName(row.ascendant_sign) }
        : null,
    }))

    const response: FilterResponse = {
      data:   celebrities,
      count:  totalCount,
      limit,
      offset,
      active_filters: filters.map((f) => ({
        planet:    f.planet,
        sign:      f.sign,
        sign_name: signName(f.sign),
      })),
    }

    return NextResponse.json(response)
  } catch (err) {
    console.error('[/api/filter] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
