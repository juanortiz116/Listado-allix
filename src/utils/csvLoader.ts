import * as Papa from 'papaparse';
import { Item, Module, ModuleRecipe } from '../types';

// Paths to CSVs in public folder
const ITEMS_CSV = '/data/Component_export (1).csv';
const RECIPES_CSV = '/data/ModuleComponent_export.csv';

export const loadData = async () => {
    const items: Item[] = [];
    const recipes: ModuleRecipe[] = [];
    const modulesMap = new Map<string, Module>();

    try {
        // 1. Load Items
        const itemsText = await fetch(ITEMS_CSV).then(r => r.text());
        Papa.parse(itemsText, {
            header: true,
            skipEmptyLines: true,
            complete: (results: any) => {
                results.data.forEach((row: any) => {
                    if (row.id && row.sku_obramat) {
                        items.push({
                            id: row.id,
                            sku: row.sku_obramat,
                            name: row.name,
                            category: row.category,
                            price: parseFloat(row.price_cost || '0'),
                            width: parseFloat(row.dimensions_width || '0'),
                            height: parseFloat(row.dimensions_height || '0'),
                            depth: parseFloat(row.dimensions_depth || '0'),
                            brand: row.brand,
                        });
                    }
                });
            }
        });

        // 2. Load Recipes
        const recipesText = await fetch(RECIPES_CSV).then(r => r.text());
        Papa.parse(recipesText, {
            header: true,
            skipEmptyLines: true,
            complete: (results: any) => {
                results.data.forEach((row: any) => {
                    if (row.module_id && row.component_id) {
                        recipes.push({
                            id: row.id || crypto.randomUUID(),
                            module_id: row.module_id,
                            item_id: row.component_id,
                            quantity: parseInt(row.quantity || '1', 10),
                        });

                        // Infer Module if not exists
                        if (!modulesMap.has(row.module_id)) {
                            // Since we don't have module names, we generates placeholders
                            // Ideally we would load a Modules CSV here.
                            modulesMap.set(row.module_id, {
                                id: row.module_id,
                                name: `Module ${row.module_id.substring(0, 8)}...`, // Placeholder
                                category: 'Imported',
                            });
                        }
                    }
                });
            }
        });

    } catch (error) {
        console.error("Failed to load CSV data", error);
    }

    return {
        items,
        recipes,
        modules: Array.from(modulesMap.values()),
    };
};
