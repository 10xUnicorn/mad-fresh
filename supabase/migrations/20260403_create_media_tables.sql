-- Create media_folders table
CREATE TABLE IF NOT EXISTS media_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  parent_id UUID REFERENCES media_folders(id) ON DELETE CASCADE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_folder_slug UNIQUE(store_id, slug, parent_id)
);

-- Create media_assets table
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  folder_id UUID REFERENCES media_folders(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  width INTEGER,
  height INTEGER,
  title TEXT,
  alt_text TEXT,
  description TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_featured BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_media_folders_store_id ON media_folders(store_id);
CREATE INDEX idx_media_folders_parent_id ON media_folders(parent_id);
CREATE INDEX idx_media_assets_store_id ON media_assets(store_id);
CREATE INDEX idx_media_assets_folder_id ON media_assets(folder_id);
CREATE INDEX idx_media_assets_title ON media_assets(title);
CREATE INDEX idx_media_assets_tags ON media_assets USING GIN(tags);
CREATE INDEX idx_media_assets_is_featured ON media_assets(is_featured);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_media_folders_timestamp BEFORE UPDATE ON media_folders
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_media_assets_timestamp BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Enable Row Level Security (if needed)
ALTER TABLE media_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated users
CREATE POLICY "Users can read their own store media folders"
  ON media_folders FOR SELECT
  USING (store_id = (SELECT store_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert media folders for their store"
  ON media_folders FOR INSERT
  WITH CHECK (store_id = (SELECT store_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own store media folders"
  ON media_folders FOR UPDATE
  USING (store_id = (SELECT store_id FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (store_id = (SELECT store_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their own store media folders"
  ON media_folders FOR DELETE
  USING (store_id = (SELECT store_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can read their own store media assets"
  ON media_assets FOR SELECT
  USING (store_id = (SELECT store_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert media assets for their store"
  ON media_assets FOR INSERT
  WITH CHECK (store_id = (SELECT store_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own store media assets"
  ON media_assets FOR UPDATE
  USING (store_id = (SELECT store_id FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (store_id = (SELECT store_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can delete their own store media assets"
  ON media_assets FOR DELETE
  USING (store_id = (SELECT store_id FROM auth.users WHERE id = auth.uid()));
