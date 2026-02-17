export interface Item {
    id: string;
    sku: string;
    name: string;
    category: string;
    price: number;
    // Extra fields from CSV
    width?: number;
    height?: number;
    depth?: number;
    brand?: string;
    // Smart Substitution Fields
    model?: string;
    finish?: string;
    hand?: string; // 'Left' | 'Right' | 'None'
}

export interface Module {
    id: string;
    name: string;
    category: string;
}

export interface ModuleRecipe {
    id: string; // unique ID for the recipe line item
    module_id: string;
    item_id: string;
    quantity: number;
}
