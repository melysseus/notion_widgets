-- =============================================================================
-- AstroCeleb — Supabase RPC functions
-- Run after schema.sql + all migrations in order.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- search_celebrities
-- Unified search + multi-planet/nakshatra filter in one round-trip.
--
-- planet_filters JSON shape:
--   [{"planet": "sun", "sign": 5}, {"planet": "moon", "sign": 6}]
-- nakshatra_filters JSON shape:
--   [{"planet": "moon", "nakshatra": 22}, {"planet": "sun", "nakshatra": 15}]
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION search_celebrities(
    name_query                  text    DEFAULT NULL,
    planet_filters              jsonb   DEFAULT '[]'::jsonb,
    nakshatra_filters           jsonb   DEFAULT '[]'::jsonb,
    ascendant_filter            int     DEFAULT NULL,
    ascendant_nakshatra_filter  int     DEFAULT NULL,
    profession                  text    DEFAULT NULL,
    lim                         int     DEFAULT 20,
    off                         int     DEFAULT 0
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
        -- Correlated subqueries — hit idx_placements_planet_sign
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
        -- text name search (pg_trgm GIN index)
        (name_query IS NULL OR c.name ILIKE '%' || name_query || '%')

        -- profession array filter (GIN index)
        AND (profession IS NULL OR profession = ANY(c.professions))

        -- ascendant sign filter
        AND (ascendant_filter IS NULL OR ch.ascendant_sign = ascendant_filter)

        -- ascendant nakshatra filter (idx_charts_asc_nakshatra)
        AND (ascendant_nakshatra_filter IS NULL
             OR ch.ascendant_nakshatra = ascendant_nakshatra_filter)

        -- planet-in-sign AND filter:
        -- count matched (planet, sign) pairs; must equal total filters supplied
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

        -- planet-in-nakshatra AND filter (idx_placements_planet_nakshatra)
        AND (
            jsonb_array_length(nakshatra_filters) = 0
            OR (
                SELECT COUNT(1)
                FROM   jsonb_array_elements(nakshatra_filters) AS elem
                WHERE  EXISTS (
                    SELECT 1
                    FROM   placements p
                    WHERE  p.chart_id  = ch.id
                      AND  p.planet    = (elem ->> 'planet')
                      AND  p.nakshatra = (elem ->> 'nakshatra')::int
                )
            ) = jsonb_array_length(nakshatra_filters)
        )

    ORDER BY c.name
    LIMIT  lim
    OFFSET off;
$$;


-- ---------------------------------------------------------------------------
-- filter_options
-- Returns sign + nakshatra distribution per planet for the filter UI.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION filter_options()
RETURNS TABLE (
    planet     text,
    sign       smallint,
    nakshatra  smallint,
    count      bigint
)
LANGUAGE sql STABLE SECURITY INVOKER AS $$
    SELECT
        p.planet,
        p.sign,
        p.nakshatra,
        COUNT(DISTINCT ch.celebrity_id) AS count
    FROM placements p
    JOIN charts ch
      ON  ch.id           = p.chart_id
      AND ch.ayanamsa     = 'lahiri'
      AND ch.house_system = 'whole_sign'
    GROUP BY p.planet, p.sign, p.nakshatra
    ORDER BY p.planet, p.sign, p.nakshatra;
$$;
