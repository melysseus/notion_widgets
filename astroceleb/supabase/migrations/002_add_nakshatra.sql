-- Nakshatra = 1 of 27 lunar mansions, each spanning 360/27 = 13°20'.
-- Run after schema.sql + 001_add_ascendant_to_charts.sql.

ALTER TABLE placements
    ADD COLUMN nakshatra smallint CHECK (nakshatra BETWEEN 1 AND 27);

ALTER TABLE charts
    ADD COLUMN ascendant_nakshatra smallint CHECK (ascendant_nakshatra BETWEEN 1 AND 27);

-- Dedicated index so nakshatra filters hit cache rather than scanning
CREATE INDEX idx_placements_planet_nakshatra ON placements (planet, nakshatra);
CREATE INDEX idx_charts_asc_nakshatra        ON charts (ascendant_nakshatra);
