import { useState, useMemo } from 'react';
import { Search, Plus, Save, Trash2, Box } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Item } from '../types';

export const Configurator = () => {
    const { items, addModule, addRecipe } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
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

    const handleSave = () => {
        if (!moduleName || currentRecipe.length === 0) return;

        const newModuleId = crypto.randomUUID();

        // Save Module
        addModule({
            id: newModuleId,
            name: moduleName,
            category: moduleCategory
        });

        // Save Recipes
        currentRecipe.forEach(line => {
            addRecipe({
                id: crypto.randomUUID(),
                module_id: newModuleId,
                item_id: line.item.id,
                quantity: line.quantity
            });
        });

        // Reset
        setModuleName('');
        setCurrentRecipe([]);
        alert('Módulo guardado correctamente');
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* LEFT: Items */}
            <div className="w-1/3 border-r border-border bg-surface flex flex-col">
                <div className="p-4 border-b border-border">
                    <h2 className="text-xl font-bold mb-4 text-accent">Componentes</h2>
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
                            Nuevo Módulo
                        </h2>
                        <p className="text-gray-400 text-sm">Define la receta de tu nuevo producto</p>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={!moduleName || currentRecipe.length === 0}
                        className="bg-accent text-emerald-950 px-6 py-2 rounded-lg font-bold hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" /> Guardar Módulo
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
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
        </div>
    );
};
