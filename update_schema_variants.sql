-- Add new columns for Smart Substitution
ALTER TABLE items 
ADD COLUMN IF NOT EXISTS model TEXT DEFAULT 'Generic',
ADD COLUMN IF NOT EXISTS finish TEXT DEFAULT 'Standard',
ADD COLUMN IF NOT EXISTS hand TEXT DEFAULT 'None'; -- 'Left', 'Right', 'None'

-- Optional: Index for faster substitution lookups
CREATE INDEX IF NOT EXISTS idx_items_substitution 
ON items (category, width, height, model, finish, hand);
