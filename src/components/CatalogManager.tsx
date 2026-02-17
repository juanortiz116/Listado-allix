import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Plus, Trash2, Tag, Palette } from 'lucide-react';

export const CatalogManager = () => {
    const { catalogModels, catalogFinishes, addCatalogModel, deleteCatalogModel, addCatalogFinish, deleteCatalogFinish } = useStore();
    const [newItemName, setNewItemName] = useState('');
    const [activeTab, setActiveTab] = useState<'models' | 'finishes'>('models');

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newItemName.trim()) return;

        if (activeTab === 'models') {
            await addCatalogModel(newItemName.trim());
        } else {
            await addCatalogFinish(newItemName.trim());
        }
        setNewItemName('');
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro? Esto no afectará a los productos existentes, solo al listado.')) return;

        if (activeTab === 'models') {
            await deleteCatalogModel(id);
        } else {
            await deleteCatalogFinish(id);
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                Gestor de Catálogo
            </h1>

            <div className="flex gap-4 mb-8">
                <button
                    onClick={() => setActiveTab('models')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold border ${activeTab === 'models' ? 'bg-accent text-emerald-950 border-accent' : 'bg-surface border-border text-gray-400 hover:text-white'}`}
                >
                    <Tag className="w-5 h-5" /> Modelos / Series
                </button>
                <button
                    onClick={() => setActiveTab('finishes')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold border ${activeTab === 'finishes' ? 'bg-accent text-emerald-950 border-accent' : 'bg-surface border-border text-gray-400 hover:text-white'}`}
                >
                    <Palette className="w-5 h-5" /> Acabados / Colores
                </button>
            </div>

            <div className="bg-surface rounded-xl border border-border overflow-hidden">
                <div className="p-6 border-b border-border bg-surface/50">
                    <form onSubmit={handleAdd} className="flex gap-4">
                        <input
                            type="text"
                            placeholder={`Nombre d${activeTab === 'models' ? 'el Modelo' : 'el Acabado'} (ej: ${activeTab === 'models' ? 'Tokyo' : 'Rojo Mate'})`}
                            className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-white focus:ring-1 focus:ring-accent outline-none"
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={!newItemName.trim()}
                            className="bg-accent text-emerald-950 px-6 py-2 rounded-lg font-bold hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" /> Añadir
                        </button>
                    </form>
                </div>

                <div className="divide-y divide-border">
                    {(activeTab === 'models' ? catalogModels : catalogFinishes).length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            No hay elementos creados aún. Añade uno arriba.
                        </div>
                    )}
                    {(activeTab === 'models' ? catalogModels : catalogFinishes).map((item) => (
                        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                            <span className="font-medium text-lg">{item.name}</span>
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="text-gray-400 hover:text-red-400 p-2 rounded hover:bg-white/5 transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
