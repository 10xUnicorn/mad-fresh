ALTER TABLE catering_packages ADD COLUMN IF NOT EXISTS menu_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE catering_packages ADD COLUMN IF NOT EXISTS equipment JSONB DEFAULT '[]'::jsonb;
