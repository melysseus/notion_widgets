/**
 * GET /api/celebrities/[slug]
 *
 * Returns full celebrity profile including all planetary placements.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/lib/supabase'
import { signName, sortPlacements, getNakshatraData } from '@/lib/astro'
import type { CelebrityProfile, Placement } from '@/types'

export const runtime = 'nodejs'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } },
) {
  const { slug } = params
  const supabase = getSupabaseClient()

  // ── 1. celebrity row ───────────────────────────────────────────────────────
  const { data: celebrity, error: celebError } = await supabase
    .from('celebrities')
    .select('*')
    .eq('slug', slug)
    .single()

  if (celebError?.code === 'PGRST116' || !celebrity) {
    return NextResponse.json({ error: 'Celebrity not found' }, { status: 404 })
  }
  if (celebError) {
    console.error('[/api/celebrities/[slug]] celebrity lookup:', celebError)
    return NextResponse.json({ error: 'Database error' }, { status: 502 })
  }

  // ── 2. chart (lahiri + whole_sign only) ───────────────────────────────────
  const { data: chart, error: chartError } = await supabase
    .from('charts')
    .select('*')
    .eq('celebrity_id', celebrity.id)
    .eq('ayanamsa', 'lahiri')
    .eq('house_system', 'whole_sign')
    .single()

  if (chartError?.code === 'PGRST116' || !chart) {
    return NextResponse.json({ error: 'Chart not available' }, { status: 404 })
  }
  if (chartError) {
    console.error('[/api/celebrities/[slug]] chart lookup:', chartError)
    return NextResponse.json({ error: 'Database error' }, { status: 502 })
  }

  // ── 3. placements ──────────────────────────────────────────────────────────
  const { data: rawPlacements, error: placementsError } = await supabase
    .from('placements')
    .select('*')
    .eq('chart_id', chart.id)

  if (placementsError) {
    console.error('[/api/celebrities/[slug]] placements lookup:', placementsError)
    return NextResponse.json({ error: 'Database error' }, { status: 502 })
  }

  const placements: Placement[] = sortPlacements(
    (rawPlacements ?? []).map((p) => ({
      ...p,
      sign_name:      signName(p.sign),
      nakshatra_name: p.nakshatra ? (getNakshatraData(p.nakshatra)?.name ?? null) : null,
    })),
  )

  // ── 4. build response ──────────────────────────────────────────────────────
  const profile: CelebrityProfile = {
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
    sun_sign:         null,
    moon_sign:        null,
    ascendant:        chart.ascendant_sign
      ? { sign: chart.ascendant_sign, sign_name: signName(chart.ascendant_sign) }
      : null,
    chart: {
      ascendant: chart.ascendant_sign
        ? {
            sign:           chart.ascendant_sign,
            sign_name:      signName(chart.ascendant_sign),
            degree:         chart.ascendant_degree ?? 0,
            nakshatra:      chart.ascendant_nakshatra ?? null,
            nakshatra_name: chart.ascendant_nakshatra
              ? (getNakshatraData(chart.ascendant_nakshatra)?.name ?? null)
              : null,
          }
        : null,
      placements,
    },
  }

  return NextResponse.json(profile, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  })
}
