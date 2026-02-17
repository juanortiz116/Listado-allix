
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { fileURLToPath } from 'url';

// Helper to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read .env manually
const envPath = path.resolve(__dirname, '../.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = envContent.split('\n').reduce((acc, line) => {
    const [key, value] = line.split('=');
    if (key && value) {
        acc[key.trim()] = value.trim();
    }
    return acc;
}, {});

const supabaseUrl = envVars.VITE_SUPABASE_URL;
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ITEMS_CSV = path.resolve(__dirname, '../public/data/Component_export (1).csv');
const RECIPES_CSV = path.resolve(__dirname, '../public/data/ModuleComponent_export.csv');

async function migrate() {
    console.log("Starting migration...");

    // 1. Read and Parse Items
    console.log("Reading Items CSV...");
    const itemsFile = fs.readFileSync(ITEMS_CSV, 'utf-8');
    const itemsData = Papa.parse(itemsFile, { header: true, skipEmptyLines: true }).data;

    const itemMap = new Map(); // oldId -> newUUID
    const itemsToInsert = [];

    for (const row of itemsData) {
        if (!row.id) continue;

        const newId = crypto.randomUUID();
        itemMap.set(row.id, newId);

        // Detect Hand from Name (logic for "Izquierda"/"Derecha")
        let hand = 'None';
        const nameLower = (row.name || '').toLowerCase();
        if (nameLower.includes('izquierda') || nameLower.includes('izq')) hand = 'Left';
        else if (nameLower.includes('derecha') || nameLower.includes('dcha')) hand = 'Right';

        itemsToInsert.push({
            id: newId,
            sku: row.sku_obramat || 'UNKNOWN',
            name: row.name || 'Unknown Item',
            category: row.category || 'General',
            price: parseFloat(row.price_cost || '0'),
            width: parseFloat(row.dimensions_width || '0'),
            height: parseFloat(row.dimensions_height || '0'),
            depth: parseFloat(row.dimensions_depth || '0'),
            brand: row.brand,
            // New Fields
            model: row.model_series || 'Generic',
            finish: row.finish_color || 'Standard',
            hand: hand,
            created_at: new Date().toISOString()
        });
    }

    console.log(`Found ${itemsToInsert.length} items. Inserting...`);
    const { error: itemsError } = await supabase.from('items').insert(itemsToInsert);
    if (itemsError) {
        console.error("Error inserting items:", itemsError);
        return;
    }
    console.log("Items inserted successfully.");

    // 2. Read and Parse Recipes to find Modules and Links
    console.log("Reading Recipes CSV...");
    const recipesFile = fs.readFileSync(RECIPES_CSV, 'utf-8');
    const recipesData = Papa.parse(recipesFile, { header: true, skipEmptyLines: true }).data;

    const moduleMap = new Map(); // oldId -> newUUID
    const modulesToInsert = [];
    const recipesToInsert = [];

    for (const row of recipesData) {
        if (!row.module_id || !row.component_id) continue;

        // Resolve Item ID
        const newItemId = itemMap.get(row.component_id);
        if (!newItemId) {
            console.warn(`Skipping recipe line: Item ID ${row.component_id} not found in migrated items.`);
            continue;
        }

        // Resolve Module ID
        let newModuleId = moduleMap.get(row.module_id);
        if (!newModuleId) {
            newModuleId = crypto.randomUUID();
            moduleMap.set(row.module_id, newModuleId);

            // Create Module Entry
            modulesToInsert.push({
                id: newModuleId,
                name: `Module ${row.module_id.substring(0, 8)}...`, // Placeholder name
                category: 'Imported',
                created_at: new Date().toISOString()
            });
        }

        recipesToInsert.push({
            module_id: newModuleId,
            item_id: newItemId,
            quantity: parseInt(row.quantity || '1', 10)
        });
    }

    // 3. Insert Modules
    console.log(`Found ${modulesToInsert.length} unique modules. Inserting...`);
    const { error: modulesError } = await supabase.from('modules').insert(modulesToInsert);
    if (modulesError) {
        console.error("Error inserting modules:", modulesError);
        return;
    }
    console.log("Modules inserted successfully.");

    // 4. Insert Recipes
    console.log(`Found ${recipesToInsert.length} recipe lines. Inserting...`);
    const { error: recipesError } = await supabase.from('module_recipes').insert(recipesToInsert);
    if (recipesError) {
        console.error("Error inserting recipes:", recipesError);
        return;
    }
    console.log("Recipes inserted successfully.");

    console.log("Migration Complete!");
}

migrate().catch(console.error);
