-- =============================================================================
-- AstroCeleb — Supabase RPC functions
-- Run after schema.sql + migrations/001_add_ascendant_to_charts.sql
-- =============================================================================

-- ---------------------------------------------------------------------------
-- search_celebrities
-- Unified search + multi-planet filter in one round-trip.
--
-- planet_filters JSON shape:
--   [{"planet": "sun", "sign": 5}, {"planet": "moon", "sign": 6}]
-- ascendant_filter: sign number 1–12, for Rising sign filtering
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_celebrities(
    name_query        text    DEFAULT NULL,
    planet_filters    jsonb   DEFAULT '[]'::jsonb,
    ascendant_filter  int     DEFAULT NULL,
    profession        text    DEFAULT NULL,
    lim               int     DEFAULT 20,
    off               int     DEFAULT 0
)
RETURNS TABLE (
    id               uuid,
    name             text,
    slug             text,
    birth_date       date,
    birth_time_known boolean,
    rodden_rating    text,
    professions      text[],
    image_url        text,
    ascendant_sign   smallint,
    ascendant_degree numeric,
    sun_sign         smallint,
    moon_sign        smallint,
    total_count      bigint
)
LANGUAGE sql STABLE SECURITY INVOKER AS $$
    SELECT
        c.id,
        c.name,
        c.slug,
        c.birth_date,
        c.birth_time_known,
        c.rodden_rating::text,
        c.professions,
        c.image_url,
        ch.ascendant_sign,
        ch.ascendant_degree,
        -- Correlated subqueries hit idx_placements_planet_sign
        (SELECT p.sign::smallint FROM placements p
         WHERE p.chart_id = ch.id AND p.planet = 'sun'  LIMIT 1) AS sun_sign,
        (SELECT p.sign::smallint FROM placements p
         WHERE p.chart_id = ch.id AND p.planet = 'moon' LIMIT 1) AS moon_sign,
        COUNT(*) OVER () AS total_count
    FROM celebrities c
    JOIN charts ch
      ON  ch.celebrity_id = c.id
      AND ch.ayanamsa     = 'lahiri'
      AND ch.house_system = 'whole_sign'
    WHERE
        -- name search (uses pg_trgm GIN index)
        (name_query IS NULL OR c.name ILIKE '%' || name_query || '%')

        -- rising sign filter (checks charts.ascendant_sign directly)
        AND (ascendant_filter IS NULL OR ch.ascendant_sign = ascendant_filter)

        -- profession array filter
        AND (profession IS NULL OR profession = ANY(c.professions))

        -- multi-planet AND filter:
        -- count how many required (planet, sign) pairs exist in this chart;
        -- it must equal the total number of filters supplied.
        AND (
            jsonb_array_length(planet_filters) = 0
            OR (
                SELECT COUNT(1)
                FROM   jsonb_array_elements(planet_filters) AS elem
                WHERE  EXISTS (
                    SELECT 1
                    FROM   placements p
                    WHERE  p.chart_id = ch.id
                      AND  p.planet   = (elem ->> 'planet')
                      AND  p.sign     = (elem ->> 'sign')::int
                )
            ) = jsonb_array_length(planet_filters)
        )
    ORDER BY c.name
    LIMIT  lim
    OFFSET off;
$$;


-- ---------------------------------------------------------------------------
-- filter_options
-- Returns sign distribution per planet — drives the filter UI dropdowns.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION filter_options()
RETURNS TABLE (
    planet     text,
    sign       smallint,
    count      bigint
)
LANGUAGE sql STABLE SECURITY INVOKER AS $$
    SELECT
        p.planet,
        p.sign,
        COUNT(DISTINCT ch.celebrity_id) AS count
    FROM placements p
    JOIN charts ch
      ON  ch.id           = p.chart_id
      AND ch.ayanamsa     = 'lahiri'
      AND ch.house_system = 'whole_sign'
    GROUP BY p.planet, p.sign
    ORDER BY p.planet, p.sign;
$$;
