import { create } from 'zustand';
import { Item, Module, ModuleRecipe } from '../types';
import { supabase } from '../supabaseClient';
// import { loadData } from '../utils/csvLoader'; // Removed CSV loader

interface StoreState {
    items: Item[];
    modules: Module[];
    recipes: ModuleRecipe[];
    basket: Record<string, number>; // moduleId -> quantity
    isLoading: boolean;
    initialized: boolean;

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
    getMaterialList: () => { item: Item; quantity: number; totalPrice: number }[];
    getTotalPrice: () => number;
}

export const useStore = create<StoreState>((set, get) => ({
    items: [],
    modules: [],
    recipes: [],
    basket: {},
    isLoading: false,
    initialized: false,

    initialize: async () => {
        if (get().initialized) return;
        set({ isLoading: true });
        console.log("Initializing Supabase Store...");
        try {
            // Fetch all data in parallel
            console.log("Fetching data from Supabase...");
            const [itemsRes, modulesRes, recipesRes] = await Promise.all([
                supabase.from('items').select('*'),
                supabase.from('modules').select('*'),
                supabase.from('module_recipes').select('*')
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

            console.log("Data fetched successfully:", {
                items: itemsRes.data.length,
                modules: modulesRes.data.length,
                recipes: recipesRes.data.length
            });

            set({
                items: itemsRes.data as Item[],
                modules: modulesRes.data as Module[],
                recipes: recipesRes.data as ModuleRecipe[],
                initialized: true,
            });
        } catch (error) {
            console.error("Failed to initialize store from Supabase", error);
        } finally {
            set({ isLoading: false });
        }
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
        const materialMap = new Map<string, number>(); // itemId -> quantity

        // Explode basket
        Object.entries(state.basket).forEach(([moduleId, moduleQty]) => {
            const moduleRecipes = state.recipes.filter((r) => r.module_id === moduleId);
            moduleRecipes.forEach((recipe) => {
                const currentQty = materialMap.get(recipe.item_id) || 0;
                materialMap.set(recipe.item_id, currentQty + recipe.quantity * moduleQty);
            });
        });

        // Aggregate
        const result: { item: Item; quantity: number; totalPrice: number }[] = [];
        materialMap.forEach((qty, itemId) => {
            const item = state.items.find((i) => i.id === itemId);
            if (item) {
                result.push({
                    item,
                    quantity: qty,
                    totalPrice: item.price * qty,
                });
            }
        });

        return result.sort((a, b) => a.item.sku.localeCompare(b.item.sku));
    },

    getTotalPrice: () => {
        const materials = get().getMaterialList();
        return materials.reduce((sum, m) => sum + m.totalPrice, 0);
    },
}));
