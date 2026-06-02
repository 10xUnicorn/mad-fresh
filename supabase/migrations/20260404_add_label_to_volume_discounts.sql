-- Add label column to volume_discount_tiers table
ALTER TABLE volume_discount_tiers
ADD COLUMN IF NOT EXISTS label TEXT DEFAULT '';

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_volume_discount_tiers_store_id ON volume_discount_tiers(store_id);
