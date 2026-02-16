import { create } from 'zustand';
import { Item, Module, ModuleRecipe } from '../types';
import { loadData } from '../utils/csvLoader';

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
    addModule: (module: Module) => void;
    updateModule: (module: Module) => void;
    addItem: (item: Item) => void;
    addRecipe: (recipe: ModuleRecipe) => void;
    deleteRecipesByModule: (moduleId: string) => void;

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
        try {
            const data = await loadData();
            set({
                items: data.items,
                modules: data.modules,
                recipes: data.recipes,
                initialized: true,
            });
        } catch (error) {
            console.error("Failed to initialize store", error);
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

    // Admin Actions
    addModule: (module) => set((state) => ({ modules: [...state.modules, module] })),

    updateModule: (module) => set((state) => ({
        modules: state.modules.map(m => m.id === module.id ? module : m)
    })),

    addItem: (item) => set((state) => ({ items: [...state.items, item] })),

    addRecipe: (recipe) => set((state) => ({ recipes: [...state.recipes, recipe] })),

    deleteRecipesByModule: (moduleId) => set((state) => ({
        recipes: state.recipes.filter(r => r.module_id !== moduleId)
    })),

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
