-- Ensure catering_service_levels table exists with correct schema
CREATE TABLE IF NOT EXISTS catering_service_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  min INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(store_id, name)
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_catering_service_levels_store_id ON catering_service_levels(store_id);
