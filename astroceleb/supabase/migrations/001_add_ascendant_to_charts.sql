-- Ascendant lives on the chart, not in the placements table.
-- Run this after schema.sql.

ALTER TABLE charts
    ADD COLUMN ascendant_sign   smallint    CHECK (ascendant_sign   BETWEEN 1 AND 12),
    ADD COLUMN ascendant_degree numeric(6,4) CHECK (ascendant_degree >= 0
                                                AND ascendant_degree <  30);
