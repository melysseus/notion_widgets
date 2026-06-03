-- =============================================================================
-- AstroCeleb — Supabase PostgreSQL Schema
-- Ayanamsa: Lahiri (sidereal). House system: Whole Sign.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;   -- trigram index for name search


-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------

-- Future-proofed: MVP only uses lahiri + whole_sign
CREATE TYPE ayanamsa_type AS ENUM ('lahiri', 'raman', 'krishnamurti');
CREATE TYPE house_system_type AS ENUM ('whole_sign', 'placidus', 'equal');

-- Rodden rating — standard data-quality scale used in astrology databases
-- AA=birth certificate, A=memory, B=biography, C=caution, DD=conflicting,
-- X=no time, XX=no date
CREATE TYPE rodden_rating AS ENUM ('AA', 'A', 'B', 'C', 'DD', 'X', 'XX');


-- ---------------------------------------------------------------------------
-- celebrities
-- ---------------------------------------------------------------------------

CREATE TABLE celebrities (
    id                  uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                text        NOT NULL,
    slug                text        NOT NULL UNIQUE,           -- URL key, e.g. "beyonce"
    birth_date          date        NOT NULL,
    birth_time          time,                                  -- NULL when unknown
    birth_time_known    boolean     NOT NULL DEFAULT false,
    rodden_rating       rodden_rating,                         -- data-quality indicator
    birth_place         text,
    birth_latitude      numeric(9,6),
    birth_longitude     numeric(9,6),
    timezone_name       text,                                  -- IANA, e.g. "America/New_York"
    professions         text[]      NOT NULL DEFAULT '{}',     -- e.g. {"actor","musician"}
    image_url           text,
    notes               text,                                  -- editor notes, source links
    created_at          timestamptz NOT NULL DEFAULT now(),
    updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER celebrities_updated_at
    BEFORE UPDATE ON celebrities
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ---------------------------------------------------------------------------
-- charts
-- ---------------------------------------------------------------------------
-- One row per (celebrity × ayanamsa × house_system).
-- MVP will have exactly one row per celebrity: lahiri + whole_sign.

CREATE TABLE charts (
    id              uuid            PRIMARY KEY DEFAULT uuid_generate_v4(),
    celebrity_id    uuid            NOT NULL REFERENCES celebrities(id) ON DELETE CASCADE,
    ayanamsa        ayanamsa_type   NOT NULL DEFAULT 'lahiri',
    house_system    house_system_type NOT NULL DEFAULT 'whole_sign',
    calculated_at   timestamptz     NOT NULL,
    created_at      timestamptz     NOT NULL DEFAULT now(),

    UNIQUE (celebrity_id, ayanamsa, house_system)
);


-- ---------------------------------------------------------------------------
-- placements
-- ---------------------------------------------------------------------------
-- One row per planet per chart.
-- sign: 1=Aries, 2=Taurus, 3=Gemini, 4=Cancer, 5=Leo, 6=Virgo,
--       7=Libra, 8=Scorpio, 9=Sagittarius, 10=Capricorn, 11=Aquarius, 12=Pisces

CREATE TABLE placements (
    id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
    chart_id        uuid        NOT NULL REFERENCES charts(id) ON DELETE CASCADE,

    planet          text        NOT NULL,
    sign            smallint    NOT NULL,
    degree_in_sign  numeric(6,4) NOT NULL,   -- 0.0000–29.9999
    absolute_degree numeric(7,4) NOT NULL,   -- 0.0000–359.9999
    house           smallint,                -- NULL when birth time unknown
    retrograde      boolean     NOT NULL DEFAULT false,

    -- ---- constraints -------------------------------------------------------
    CONSTRAINT valid_planet CHECK (planet IN (
        'sun', 'moon', 'mercury', 'venus', 'mars',
        'jupiter', 'saturn', 'rahu', 'ketu',
        'uranus', 'neptune', 'pluto'
    )),
    CONSTRAINT valid_sign           CHECK (sign BETWEEN 1 AND 12),
    CONSTRAINT valid_degree_in_sign CHECK (degree_in_sign >= 0 AND degree_in_sign < 30),
    CONSTRAINT valid_absolute_degree CHECK (absolute_degree >= 0 AND absolute_degree < 360),
    CONSTRAINT valid_house          CHECK (house BETWEEN 1 AND 12),

    UNIQUE (chart_id, planet)
);


-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

-- Core filter: "Moon in Virgo", "Mars in Scorpio"
CREATE INDEX idx_placements_planet_sign  ON placements (planet, sign);

-- FK traversal (Supabase does not auto-create FK indexes)
CREATE INDEX idx_charts_celebrity_id     ON charts (celebrity_id);
CREATE INDEX idx_placements_chart_id     ON placements (chart_id);

-- Celebrity name search (trigram — supports partial/fuzzy matching)
CREATE INDEX idx_celebrities_name_trgm   ON celebrities USING gin (name gin_trgm_ops);

-- Profession filter: "actors with Moon in Virgo"
CREATE INDEX idx_celebrities_professions ON celebrities USING gin (professions);

-- Slug lookup (covered by UNIQUE constraint, listed here for clarity)
-- idx already exists from UNIQUE(slug)


-- ---------------------------------------------------------------------------
-- View: celebrity_placements
-- Flattens the three-table join for the common filter query pattern.
-- Only surfaces lahiri + whole_sign rows (the MVP default).
-- ---------------------------------------------------------------------------

CREATE VIEW celebrity_placements AS
SELECT
    c.id                AS celebrity_id,
    c.name,
    c.slug,
    c.birth_date,
    c.birth_time_known,
    c.rodden_rating,
    c.professions,
    c.image_url,
    p.planet,
    p.sign,
    p.degree_in_sign,
    p.absolute_degree,
    p.house,
    p.retrograde
FROM celebrities     c
JOIN charts          ch ON  ch.celebrity_id = c.id
                        AND ch.ayanamsa     = 'lahiri'
                        AND ch.house_system = 'whole_sign'
JOIN placements      p  ON  p.chart_id = ch.id;


-- ---------------------------------------------------------------------------
-- Row Level Security (public read for MVP)
-- ---------------------------------------------------------------------------

ALTER TABLE celebrities ENABLE ROW LEVEL SECURITY;
ALTER TABLE charts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE placements  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read celebrities" ON celebrities FOR SELECT USING (true);
CREATE POLICY "public read charts"      ON charts      FOR SELECT USING (true);
CREATE POLICY "public read placements"  ON placements  FOR SELECT USING (true);
