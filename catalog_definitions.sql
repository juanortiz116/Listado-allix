-- Catalog Models (Styles)
CREATE TABLE IF NOT EXISTS catalog_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Catalog Finishes (Colors)
CREATE TABLE IF NOT EXISTS catalog_finishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE catalog_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_finishes ENABLE ROW LEVEL SECURITY;

create policy "Public Access Models" on catalog_models for all using (true) with check (true);
create policy "Public Access Finishes" on catalog_finishes for all using (true) with check (true);

-- Seed Initial Data (based on CSVs)
INSERT INTO catalog_models (name) VALUES 
('Mallorca'), 
('Oslo'),
('Berlin'),
('Tokio')
ON CONFLICT (name) DO NOTHING;

INSERT INTO catalog_finishes (name) VALUES 
('Blanco brillo'), 
('Roble'), 
('Gris Mate'),
('Negro Mate')
ON CONFLICT (name) DO NOTHING;
