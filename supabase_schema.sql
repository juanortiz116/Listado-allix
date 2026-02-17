-- Create Items Table
CREATE TABLE IF NOT EXISTS items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    width NUMERIC,
    height NUMERIC,
    depth NUMERIC,
    brand TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Modules Table
CREATE TABLE IF NOT EXISTS modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Module Recipes Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS module_recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES modules(id) ON DELETE CASCADE,
    item_id UUID REFERENCES items(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) - Optional for now but recommended
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_recipes ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allow public read/write for now for simplicity, adjust for production)
create policy "Public Access Items" on items for all using (true) with check (true);
create policy "Public Access Modules" on modules for all using (true) with check (true);
create policy "Public Access Recipes" on module_recipes for all using (true) with check (true);
