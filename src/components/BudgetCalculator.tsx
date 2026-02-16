import { useState } from 'react';
import { Minus, Plus, ShoppingCart, Calculator, Copy } from 'lucide-react';
import { useStore } from '../store/useStore';
import { clsx } from 'clsx';

const TABS = ['Todos', 'Bajos', 'Altos', 'Columnas'];

export const BudgetCalculator = () => {
    const { modules, basket, addToBasket, updateBasket, getMaterialList, getTotalPrice } = useStore();
    const [activeTab, setActiveTab] = useState('Todos');

    const filteredModules = modules.filter(m => activeTab === 'Todos' || m.category === activeTab);
    const materialList = getMaterialList();
    const totalPrice = getTotalPrice();

    const handleCopy = () => {
        const header = "SKU\tNombre\tCantidad\tPrecio Total\n";
        const body = materialList.map(m =>
            `${m.item.sku}\t${m.item.name}\t${m.quantity}\t${m.totalPrice.toFixed(2)}`
        ).join('\n');

        navigator.clipboard.writeText(header + body);
        alert('Tabla copiada al portapapeles');
    };

    return (
        <div className="flex h-screen bg-background text-white overflow-hidden">

            {/* ZONE A: Module Catalog */}
            <div className="w-1/3 flex flex-col border-r border-border bg-surface/30">
                <div className="p-4 border-b border-border">
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {TABS.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={clsx(
                                    "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                                    activeTab === tab ? "bg-accent text-emerald-950" : "bg-surface border border-border text-gray-400 hover:text-white"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 gap-3 content-start">
                    {filteredModules.map(module => (
                        <button
                            key={module.id}
                            onClick={() => addToBasket(module.id)}
                            className="flex flex-col items-center justify-center p-4 bg-surface border border-border rounded-xl hover:border-accent hover:bg-surface/80 transition-all group text-center"
                        >
                            <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                <BoxIcon category={module.category} />
                            </div>
                            <span className="text-sm font-medium line-clamp-2">{module.name}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ZONE B: Basket */}
            <div className="w-1/4 flex flex-col border-r border-border bg-surface">
                <div className="p-4 border-b border-border bg-surface shadow-sm z-10">
                    <h2 className="font-bold flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-accent" />
                        Cesta
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {Object.entries(basket).length === 0 && (
                        <div className="text-center text-gray-500 mt-10">Cesta vacía</div>
                    )}
                    {Object.entries(basket).map(([moduleId, qty]) => {
                        const module = modules.find(m => m.id === moduleId);
                        if (!module) return null;
                        return (
                            <div key={moduleId} className="bg-background p-3 rounded-lg border border-border flex justify-between items-center">
                                <div className="flex-1 min-w-0 pr-2">
                                    <div className="text-sm font-medium truncate">{module.name}</div>
                                    <div className="text-xs text-gray-400">{module.category}</div>
                                </div>
                                <div className="flex items-center gap-2 bg-surface rounded px-1.5 py-1">
                                    <button onClick={() => updateBasket(moduleId, qty - 1)} className="hover:text-accent"><Minus className="w-3 h-3" /></button>
                                    <span className="w-4 text-center text-sm font-bold">{qty}</span>
                                    <button onClick={() => updateBasket(moduleId, qty + 1)} className="hover:text-accent"><Plus className="w-3 h-3" /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ZONE C: Materials (The Magic) */}
            <div className="flex-1 flex flex-col bg-background relative">
                <div className="absolute top-4 right-4 bg-accent text-emerald-950 px-4 py-2 rounded-lg font-bold shadow-lg z-20">
                    Total: {totalPrice.toFixed(2)} €
                </div>

                <div className="p-4 border-b border-border mt-14 sm:mt-0 flex justify-between items-center">
                    <h2 className="font-bold flex items-center gap-2 text-xl">
                        <Calculator className="w-5 h-5 text-accent" />
                        Despiece Total
                    </h2>
                    <button onClick={handleCopy} className="text-xs flex items-center gap-1 text-accent hover:underline">
                        <Copy className="w-3 h-3" /> Copiar Tabla
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-4">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-400 uppercase bg-surface/50 sticky top-0">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">SKU</th>
                                <th className="px-4 py-3">Nombre</th>
                                <th className="px-4 py-3 text-center">Cant.</th>
                                <th className="px-4 py-3 text-right rounded-r-lg">Precio</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {materialList.map(({ item, quantity, totalPrice }) => (
                                <tr key={item.id} className="hover:bg-surface/30">
                                    <td className="px-4 py-2 font-mono text-gray-400">{item.sku}</td>
                                    <td className="px-4 py-2">{item.name}</td>
                                    <td className="px-4 py-2 text-center font-bold text-accent">{quantity}</td>
                                    <td className="px-4 py-2 text-right">{totalPrice.toFixed(2)} €</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
    );
};

const BoxIcon = ({ category }: { category: string }) => {
    // Simple icon differentiator
    if (category === 'Altos') return <div className="w-5 h-3 border-2 border-current mt-1"></div>;
    if (category === 'Columnas') return <div className="w-3 h-6 border-2 border-current"></div>;
    return <div className="w-5 h-5 border-2 border-current"></div>; // Bajos (Default interaction)
}
