-- Add missing index for ascendant sign filter (ascendant_nakshatra was indexed in 002,
-- but the sign itself was not — ascendant_filter = ch.ascendant_sign did a seq scan).
CREATE INDEX IF NOT EXISTS idx_charts_ascendant_sign ON charts (ascendant_sign);

-- Drop the celebrity_placements view: it predates the ascendant/nakshatra columns,
-- is never referenced by any query or RPC, and would mislead any future reader.
DROP VIEW IF EXISTS celebrity_placements;
