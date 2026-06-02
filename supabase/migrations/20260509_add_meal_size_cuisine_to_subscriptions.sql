-- Add meal_size and cuisine_preferences to subscriptions so customer selections persist
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS meal_size text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS cuisine_preferences jsonb DEFAULT '[]'::jsonb;

-- Add index for filtering by meal size
CREATE INDEX IF NOT EXISTS idx_subscriptions_meal_size ON subscriptions(meal_size);

-- Comment for clarity
COMMENT ON COLUMN subscriptions.meal_size IS 'Selected meal size: small, medium, or large';
COMMENT ON COLUMN subscriptions.cuisine_preferences IS 'Array of selected cuisine preferences e.g. ["Indian","Italian"]';
