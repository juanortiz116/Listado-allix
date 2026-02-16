import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useStore } from '../store/useStore';

export const ItemCreator = ({ onClose }: { onClose: () => void }) => {
    const { addItem } = useStore();
    const [name, setName] = useState('');
    const [sku, setSku] = useState('');
    const [price, setPrice] = useState('');
    const [category, setCategory] = useState('General');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !price) return;

        addItem({
            id: crypto.randomUUID(),
            name,
            sku: sku || `GEN-${Math.floor(Math.random() * 10000)}`,
            category,
            price: parseFloat(price),
        });

        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-white">Nuevo Componente</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Nombre</label>
                        <input
                            autoFocus
                            type="text"
                            className="w-full bg-background border border-border rounded p-2 text-white focus:border-accent outline-none"
                            placeholder="Ej: Tirador Negro Mate"
                            value={name}
                            onChange={e => setName(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">SKU (Opcional)</label>
                            <input
                                type="text"
                                className="w-full bg-background border border-border rounded p-2 text-white focus:border-accent outline-none font-mono text-sm"
                                placeholder="Ej: 102030"
                                value={sku}
                                onChange={e => setSku(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Precio (€)</label>
                            <input
                                type="number"
                                step="0.01"
                                className="w-full bg-background border border-border rounded p-2 text-white focus:border-accent outline-none"
                                placeholder="0.00"
                                value={price}
                                onChange={e => setPrice(e.target.value)}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Categoría</label>
                        <input
                            type="text"
                            className="w-full bg-background border border-border rounded p-2 text-white focus:border-accent outline-none"
                            placeholder="Ej: Herrajes"
                            value={category}
                            onChange={e => setCategory(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={!name || !price}
                        className="w-full bg-accent text-emerald-950 font-bold py-3 rounded-lg hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4"
                    >
                        <Plus className="w-4 h-4" /> Crear Componente
                    </button>
                </form>
            </div>
        </div>
    );
};
