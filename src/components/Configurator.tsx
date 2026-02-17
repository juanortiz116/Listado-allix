import { useState, useMemo } from 'react';
import { Search, Plus, Save, Trash2, Box, PackagePlus, Edit } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Item, Module } from '../types';
import { ItemCreator } from './ItemCreator';

export const Configurator = () => {
    const { items, modules, recipes, addModule, updateModule, addRecipe, deleteRecipesByModule } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isItemCreatorOpen, setIsItemCreatorOpen] = useState(false);

    // Edit Mode State
    const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
    const [moduleName, setModuleName] = useState('');
    const [moduleCategory, setModuleCategory] = useState('Bajos');
    const [currentRecipe, setCurrentRecipe] = useState<{ item: Item; quantity: number }[]>([]);

    const filteredItems = useMemo(() => {
        return items.filter(i =>
            i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.sku.includes(searchTerm)
        ).slice(0, 50); // Limit results for performance
    }, [items, searchTerm]);

    const addToRecipe = (item: Item) => {
        setCurrentRecipe(prev => {
            const existing = prev.find(p => p.item.id === item.id);
            if (existing) {
                return prev.map(p => p.item.id === item.id ? { ...p, quantity: p.quantity + 1 } : p);
            }
            return [...prev, { item, quantity: 1 }];
        });
    };

    const updateQuantity = (itemId: string, qty: number) => {
        if (qty <= 0) {
            setCurrentRecipe(prev => prev.filter(p => p.item.id !== itemId));
        } else {
            setCurrentRecipe(prev => prev.map(p => p.item.id === itemId ? { ...p, quantity: qty } : p));
        }
    };

    const loadModuleToEdit = (module: Module) => {
        setEditingModuleId(module.id);
        setModuleName(module.name);
        setModuleCategory(module.category);

        // Reconstruct recipe
        const moduleRecipes = recipes.filter(r => r.module_id === module.id);
        const reconstructed = moduleRecipes.map(r => {
            const item = items.find(i => i.id === r.item_id);
            return item ? { item, quantity: r.quantity } : null;
        }).filter(Boolean) as { item: Item; quantity: number }[];

        setCurrentRecipe(reconstructed);
    };

    const clearEditor = () => {
        setEditingModuleId(null);
        setModuleName('');
        setModuleCategory('Bajos');
        setCurrentRecipe([]);
    };

    const handleSave = async () => {
        if (!moduleName || currentRecipe.length === 0) return;

        const idToUse = editingModuleId || crypto.randomUUID();

        try {
            if (editingModuleId) {
                // UPDATE existing
                await updateModule({
                    id: idToUse,
                    name: moduleName,
                    category: moduleCategory
                });
                await deleteRecipesByModule(idToUse);
            } else {
                // CREATE new
                await addModule({
                    id: idToUse,
                    name: moduleName,
                    category: moduleCategory
                });
            }

            // Save Recipes (Always fresh insert after delete or for new)
            // Use Promise.all for parallel insertion
            await Promise.all(currentRecipe.map(line =>
                addRecipe({
                    id: crypto.randomUUID(),
                    module_id: idToUse,
                    item_id: line.item.id,
                    quantity: line.quantity
                })
            ));

            clearEditor();
            alert(editingModuleId ? 'Módulo actualizado' : 'Módulo creado');
        } catch (error) {
            console.error("Error saving module:", error);
            alert("Hubo un error al guardar el módulo.");
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* LEFT: Items */}
            <div className="w-1/3 border-r border-border bg-surface flex flex-col">
                <div className="p-4 border-b border-border">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-accent">Componentes</h2>
                        <button
                            onClick={() => setIsItemCreatorOpen(true)}
                            className="p-2 bg-surface border border-border rounded hover:border-accent text-accent"
                            title="Crear nuevo componente"
                        >
                            <PackagePlus className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Global Settings (Smart Substitution) */}
                    <div className="mb-4 grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Modelo</label>
                            <select
                                className="w-full bg-background border border-border rounded text-xs p-1 text-white"
                                value={useStore((s) => s.globalSettings.model)}
                                onChange={(e) => useStore.getState().setGlobalSettings({ model: e.target.value })}
                            >
                                {useStore((s) => s.catalogModels).map(m => (
                                    <option key={m.id} value={m.name}>{m.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-400 mb-1">Acabado</label>
                            <select
                                className="w-full bg-background border border-border rounded text-xs p-1 text-white"
                                value={useStore((s) => s.globalSettings.finish)}
                                onChange={(e) => useStore.getState().setGlobalSettings({ finish: e.target.value })}
                            >
                                {useStore((s) => s.catalogFinishes).map(f => (
                                    <option key={f.id} value={f.name}>{f.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar SKU o nombre..."
                            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 focus:ring-1 focus:ring-accent outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filteredItems.map(item => (
                        <div key={item.id} className="p-3 bg-background rounded border border-border flex justify-between items-center hover:border-accent group cursor-pointer" onClick={() => addToRecipe(item)}>
                            <div>
                                <div className="font-medium text-sm">{item.name}</div>
                                <div className="text-xs text-gray-400">{item.sku}</div>
                            </div>
                            <Plus className="w-4 h-4 text-accent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    ))}
                </div>
            </div>

            {/* RIGHT: Builder */}
            <div className="w-2/3 flex flex-col bg-background">
                <div className="p-6 border-b border-border flex justify-between items-center bg-surface/50">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Box className="text-accent" />
                            {editingModuleId ? 'Editar Módulo' : 'Nuevo Módulo'}
                        </h2>
                        <p className="text-gray-400 text-sm">
                            {editingModuleId ? 'Modifica la receta existente' : 'Define la receta de tu nuevo producto'}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {editingModuleId && (
                            <button
                                onClick={clearEditor}
                                className="px-4 py-2 text-gray-400 hover:text-white"
                            >
                                Cancelar
                            </button>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={!moduleName || currentRecipe.length === 0}
                            className="bg-accent text-emerald-950 px-6 py-2 rounded-lg font-bold hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" /> {editingModuleId ? 'Actualizar' : 'Guardar'}
                        </button>
                    </div>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {/* Module List for Quick Load */}
                    {!editingModuleId && (
                        <div className="mb-8 p-4 bg-surface rounded-lg border border-border">
                            <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                                <Edit className="w-4 h-4" /> Editar existente
                            </h3>
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {modules.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => loadModuleToEdit(m)}
                                        className="px-3 py-1.5 bg-background border border-border rounded text-sm whitespace-nowrap hover:border-accent hover:text-accent transition-colors"
                                    >
                                        {m.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 mb-8">
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Módulo</label>
                            <input
                                type="text"
                                className="w-full bg-surface border border-border rounded p-3 text-lg font-medium focus:border-accent outline-none"
                                placeholder="Ej: Bajo Fregadero 60cm"
                                value={moduleName}
                                onChange={e => setModuleName(e.target.value)}
                            />
                        </div>
                        <div className="w-48">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría</label>
                            <select
                                className="w-full bg-surface border border-border rounded p-3 outline-none"
                                value={moduleCategory}
                                onChange={e => setModuleCategory(e.target.value)}
                            >
                                <option value="Bajos">Bajos</option>
                                <option value="Altos">Altos</option>
                                <option value="Columnas">Columnas</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-300 border-b border-border pb-2">Receta (Componentes añadidos)</h3>
                        {currentRecipe.length === 0 && (
                            <div className="text-center py-10 text-gray-500 border-2 border-dashed border-border rounded-lg">
                                Selecciona componentes de la izquierda para empezar
                            </div>
                        )}
                        {currentRecipe.map(({ item, quantity }) => (
                            <div key={item.id} className="flex items-center justify-between p-4 bg-surface rounded-lg border border-border">
                                <div className="flex-1">
                                    <div className="font-medium">{item.name}</div>
                                    <div className="text-xs text-gray-400">{item.sku}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-background rounded px-2 py-1 border border-border">
                                        <button className="w-6 h-6 hover:text-accent" onClick={() => updateQuantity(item.id, quantity - 1)}>-</button>
                                        <span className="w-8 text-center font-bold">{quantity}</span>
                                        <button className="w-6 h-6 hover:text-accent" onClick={() => updateQuantity(item.id, quantity + 1)}>+</button>
                                    </div>
                                    <button onClick={() => updateQuantity(item.id, 0)} className="text-red-400 hover:text-red-300">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {isItemCreatorOpen && (
                <ItemCreator onClose={() => setIsItemCreatorOpen(false)} />
            )}
        </div>
    );
};
