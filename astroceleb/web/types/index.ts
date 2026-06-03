// ── database row shapes ────────────────────────────────────────────────────────

export interface CelebrityRow {
  id: string
  name: string
  slug: string
  birth_date: string
  birth_time: string | null
  birth_time_known: boolean
  rodden_rating: string | null
  birth_place: string | null
  professions: string[]
  image_url: string | null
  notes: string | null
}

export interface ChartRow {
  id: string
  celebrity_id: string
  ayanamsa: string
  house_system: string
  calculated_at: string
  ascendant_sign: number | null
  ascendant_degree: number | null
}

export interface PlacementRow {
  id: string
  chart_id: string
  planet: string
  sign: number
  degree_in_sign: number
  absolute_degree: number
  house: number | null
  retrograde: boolean
}

// ── API response shapes ────────────────────────────────────────────────────────

export interface Ascendant {
  sign: number
  sign_name: string
  degree?: number  // included on profile, omitted on list
}

export interface Placement extends PlacementRow {
  sign_name: string  // enriched in API layer
}

export interface CelebrityListItem {
  id: string
  name: string
  slug: string
  birth_date: string
  birth_time_known: boolean
  rodden_rating: string | null
  professions: string[]
  image_url: string | null
  ascendant: Pick<Ascendant, 'sign' | 'sign_name'> | null
}

export interface CelebrityProfile extends CelebrityListItem {
  birth_time: string | null
  birth_place: string | null
  notes: string | null
  chart: {
    ascendant: Ascendant | null
    placements: Placement[]
  }
}

export interface PlanetFilter {
  planet: string
  sign: number
  sign_name: string
}

// ── paginated list wrapper ────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  limit: number
  offset: number
}

export interface FilterResponse extends PaginatedResponse<CelebrityListItem> {
  active_filters: PlanetFilter[]
}
