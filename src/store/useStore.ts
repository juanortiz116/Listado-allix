import { create } from 'zustand';
import { Item, Module, ModuleRecipe, CatalogModel, CatalogFinish } from '../types';
import { supabase } from '../supabaseClient';
// import { loadData } from '../utils/csvLoader'; // Removed CSV loader

interface StoreState {
    items: Item[];
    modules: Module[];
    recipes: ModuleRecipe[];
    basket: Record<string, number>; // moduleId -> quantity
    isLoading: boolean;
    initialized: boolean;

    // Global Catalog Settings (Smart Substitution)
    globalSettings: {
        model: string;
        finish: string;
    };
    setGlobalSettings: (settings: Partial<{ model: string; finish: string }>) => void;

    // Catalog Data
    catalogModels: CatalogModel[];
    catalogFinishes: CatalogFinish[];

    // Generic Actions
    addCatalogModel: (name: string) => Promise<void>;
    deleteCatalogModel: (id: string) => Promise<void>;
    addCatalogFinish: (name: string) => Promise<void>;
    deleteCatalogFinish: (id: string) => Promise<void>;

    // Actions
    initialize: () => Promise<void>;
    addToBasket: (moduleId: string, quantity?: number) => void;
    removeFromBasket: (moduleId: string) => void;
    updateBasket: (moduleId: string, quantity: number) => void;

    // Admin / Configurator Actions
    addModule: (module: Module) => Promise<void>;
    updateModule: (module: Module) => Promise<void>;
    addItem: (item: Item) => Promise<void>;
    addRecipe: (recipe: ModuleRecipe) => Promise<void>;
    deleteRecipesByModule: (moduleId: string) => Promise<void>;

    // Selectors (Logic)
    getMaterialList: () => { item: Item; quantity: number; totalPrice: number; originalItem?: Item }[];
    getTotalPrice: () => number;
}

export const useStore = create<StoreState>((set, get) => ({
    items: [],
    modules: [],
    recipes: [],
    catalogModels: [],
    catalogFinishes: [],
    basket: {},
    isLoading: false,
    initialized: false,

    globalSettings: {
        model: 'Mallorca', // Default
        finish: 'Blanco brillo' // Default
    },

    setGlobalSettings: (settings) => set((state) => ({
        globalSettings: { ...state.globalSettings, ...settings }
    })),

    initialize: async () => {
        if (get().initialized) return;
        set({ isLoading: true });
        console.log("Initializing Supabase Store...");
        try {
            // Fetch all data in parallel
            console.log("Fetching data from Supabase...");
            const [itemsRes, modulesRes, recipesRes, modelsRes, finishesRes] = await Promise.all([
                supabase.from('items').select('*'),
                supabase.from('modules').select('*'),
                supabase.from('module_recipes').select('*'),
                supabase.from('catalog_models').select('*').order('name', { ascending: true }),
                supabase.from('catalog_finishes').select('*').order('name', { ascending: true })
            ]);

            if (itemsRes.error) {
                console.error("Error fetching items:", itemsRes.error);
                throw itemsRes.error;
            }
            if (modulesRes.error) {
                console.error("Error fetching modules:", modulesRes.error);
                throw modulesRes.error;
            }
            if (recipesRes.error) {
                console.error("Error fetching recipes:", recipesRes.error);
                throw recipesRes.error;
            }
            // Allow models/finishes to fail gracefully if table doesn't exist yet
            const models = modelsRes.data || [];
            const finishes = finishesRes.data || [];

            console.log("Data fetched successfully:", {
                items: itemsRes.data.length,
                modules: modulesRes.data.length,
                recipes: recipesRes.data.length,
                models: models.length,
                finishes: finishes.length
            });

            set({
                items: itemsRes.data as Item[],
                modules: modulesRes.data as Module[],
                recipes: recipesRes.data as ModuleRecipe[],
                catalogModels: models as CatalogModel[],
                catalogFinishes: finishes as CatalogFinish[],
                initialized: true,
            });
        } catch (error) {
            console.error("Failed to initialize store from Supabase", error);
        } finally {
            set({ isLoading: false });
        }
    },

    addCatalogModel: async (name) => {
        const { data, error } = await supabase.from('catalog_models').insert({ name }).select().single();
        if (error) {
            console.error("Error adding model:", error);
            return;
        }
        set((state) => ({ catalogModels: [...state.catalogModels, data] }));
    },

    deleteCatalogModel: async (id) => {
        const { error } = await supabase.from('catalog_models').delete().eq('id', id);
        if (error) {
            console.error("Error deleting model:", error);
            return;
        }
        set((state) => ({ catalogModels: state.catalogModels.filter(m => m.id !== id) }));
    },

    addCatalogFinish: async (name) => {
        const { data, error } = await supabase.from('catalog_finishes').insert({ name }).select().single();
        if (error) {
            console.error("Error adding finish:", error);
            return;
        }
        set((state) => ({ catalogFinishes: [...state.catalogFinishes, data] }));
    },

    deleteCatalogFinish: async (id) => {
        const { error } = await supabase.from('catalog_finishes').delete().eq('id', id);
        if (error) {
            console.error("Error deleting finish:", error);
            return;
        }
        set((state) => ({ catalogFinishes: state.catalogFinishes.filter(f => f.id !== id) }));
    },

    addToBasket: (moduleId, quantity = 1) => {
        set((state) => ({
            basket: {
                ...state.basket,
                [moduleId]: (state.basket[moduleId] || 0) + quantity,
            },
        }));
    },

    removeFromBasket: (moduleId) => {
        set((state) => {
            const newBasket = { ...state.basket };
            delete newBasket[moduleId];
            return { basket: newBasket };
        });
    },

    updateBasket: (moduleId, quantity) => {
        set((state) => {
            if (quantity <= 0) {
                const newBasket = { ...state.basket };
                delete newBasket[moduleId];
                return { basket: newBasket };
            }
            return {
                basket: { ...state.basket, [moduleId]: quantity },
            };
        });
    },

    // Admin Actions - Now async with Supabase
    addModule: async (module) => {
        const { error } = await supabase.from('modules').insert(module);
        if (error) {
            console.error("Error adding module:", error);
            return;
        }
        set((state) => ({ modules: [...state.modules, module] }));
    },

    updateModule: async (module) => {
        const { error } = await supabase.from('modules').update(module).eq('id', module.id);
        if (error) {
            console.error("Error updating module:", error);
            return;
        }
        set((state) => ({
            modules: state.modules.map(m => m.id === module.id ? module : m)
        }));
    },

    addItem: async (item) => {
        const { error } = await supabase.from('items').insert(item);
        if (error) {
            console.error("Error adding item:", error);
            return;
        }
        set((state) => ({ items: [...state.items, item] }));
    },

    addRecipe: async (recipe) => {
        const { error } = await supabase.from('module_recipes').insert(recipe);
        if (error) {
            console.error("Error adding recipe:", error);
            return;
        }
        set((state) => ({ recipes: [...state.recipes, recipe] }));
    },

    deleteRecipesByModule: async (moduleId) => {
        const { error } = await supabase.from('module_recipes').delete().eq('module_id', moduleId);
        if (error) {
            console.error("Error deleting recipes:", error);
            return;
        }
        set((state) => ({
            recipes: state.recipes.filter(r => r.module_id !== moduleId)
        }));
    },

    getMaterialList: () => {
        const state = get();
        const { globalSettings, items } = state;
        const materialMap = new Map<string, number>(); // itemId -> quantity

        // Explode basket
        Object.entries(state.basket).forEach(([moduleId, moduleQty]) => {
            const moduleRecipes = state.recipes.filter((r) => r.module_id === moduleId);
            moduleRecipes.forEach((recipe) => {
                const currentQty = materialMap.get(recipe.item_id) || 0;
                materialMap.set(recipe.item_id, currentQty + recipe.quantity * moduleQty);
            });
        });

        // Aggregate & Substitute
        const result: { item: Item; quantity: number; totalPrice: number; originalItem?: Item }[] = [];

        materialMap.forEach((qty, itemId) => {
            const originalItem = items.find((i) => i.id === itemId);
            if (!originalItem) return;

            // SMART SUBSTITUTION LOGIC
            // Only substitute if the item is a 'puerta', 'frente', 'regleta', 'zocalo', 'costado' (aesthetic parts)
            // And if it has dimensions to match against.
            let finalItem = originalItem;
            const aestheticCategories = ['puerta', 'frente', 'regleta', 'zocalo', 'costado', 'accessory'];

            // Check if item needs substitution
            // Logic: If current item is NOT matching global settings, try to find one that does.
            const isAesthetic = aestheticCategories.includes(originalItem.category.toLowerCase()) ||
                (originalItem.model && originalItem.model !== 'Generic');

            if (isAesthetic) {
                // Find substitute
                const substitute = items.find(i =>
                    i.category === originalItem.category &&
                    i.width === originalItem.width &&
                    i.height === originalItem.height &&
                    i.depth === originalItem.depth && // Check depth too? Usually yes.
                    i.model === globalSettings.model &&
                    i.finish === globalSettings.finish &&
                    i.hand === originalItem.hand // Preserve hand (Left/Right)
                );

                if (substitute) {
                    finalItem = substitute;
                }
            }

            result.push({
                item: finalItem,
                quantity: qty,
                totalPrice: finalItem.price * qty,
                originalItem: finalItem.id !== originalItem.id ? originalItem : undefined
            });
        });

        return result.sort((a, b) => a.item.sku.localeCompare(b.item.sku));
    },

    getTotalPrice: () => {
        const materials = get().getMaterialList();
        return materials.reduce((sum, m) => sum + m.totalPrice, 0);
    },
}));
