-- ═══════════════════════════════════════════════════════════
-- Build Your Own Bowl — Customization Categories & Upcharges
-- ═══════════════════════════════════════════════════════════

-- Customization categories define the steps in the BYOB flow
-- e.g., "Base", "Protein", "Toppings", "Sauce", "Extras"
CREATE TABLE IF NOT EXISTS bowl_customization_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                         -- "Base", "Protein", etc.
  slug TEXT NOT NULL,                         -- "base", "protein", etc.
  description TEXT,                           -- Helper text shown to customer
  min_selections INT NOT NULL DEFAULT 0,      -- 0 = optional step
  max_selections INT NOT NULL DEFAULT 1,      -- -1 = unlimited
  is_required BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(store_id, slug)
);

-- Links ingredients to customization categories with upcharge info
CREATE TABLE IF NOT EXISTS bowl_customization_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES bowl_customization_categories(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  display_name TEXT,                          -- Override name for customer display
  upcharge NUMERIC(10,2) NOT NULL DEFAULT 0,  -- Extra cost (0 = included)
  is_default BOOLEAN NOT NULL DEFAULT false,  -- Pre-selected in BYOB flow
  is_premium BOOLEAN NOT NULL DEFAULT false,  -- Show "premium" badge
  calories_override INT,                      -- Override ingredient's cal if needed
  is_available BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(category_id, ingredient_id)
);

-- RLS policies
ALTER TABLE bowl_customization_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bowl_customization_items ENABLE ROW LEVEL SECURITY;

-- Public read for active categories
CREATE POLICY "Public can read active bowl categories"
  ON bowl_customization_categories FOR SELECT
  USING (is_active = true);

-- Public read for available items
CREATE POLICY "Public can read available bowl items"
  ON bowl_customization_items FOR SELECT
  USING (is_available = true);

-- Admin full access
CREATE POLICY "Admins can manage bowl categories"
  ON bowl_customization_categories FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can manage bowl items"
  ON bowl_customization_items FOR ALL
  USING (true)
  WITH CHECK (true);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION update_bowl_category_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bowl_categories_updated
  BEFORE UPDATE ON bowl_customization_categories
  FOR EACH ROW EXECUTE FUNCTION update_bowl_category_timestamp();

CREATE TRIGGER trg_bowl_items_updated
  BEFORE UPDATE ON bowl_customization_items
  FOR EACH ROW EXECUTE FUNCTION update_bowl_category_timestamp();

-- Seed default categories for Mad Fresh
INSERT INTO bowl_customization_categories (store_id, name, slug, description, min_selections, max_selections, is_required, sort_order)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'Base', 'base', 'Choose your foundation', 1, 1, true, 0),
  ('b0000000-0000-0000-0000-000000000001', 'Protein', 'protein', 'Pick your protein', 1, 2, true, 1),
  ('b0000000-0000-0000-0000-000000000001', 'Toppings', 'toppings', 'Add your favorites (up to 4 included)', 0, 6, false, 2),
  ('b0000000-0000-0000-0000-000000000001', 'Sauce', 'sauce', 'Choose your sauce', 0, 2, false, 3),
  ('b0000000-0000-0000-0000-000000000001', 'Extras', 'extras', 'Power up your bowl', 0, -1, false, 4)
ON CONFLICT (store_id, slug) DO NOTHING;
