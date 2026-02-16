import { useState } from 'react';
import { Configurator } from './components/Configurator';
import { BudgetCalculator } from './components/BudgetCalculator';
import { Settings, Calculator } from 'lucide-react';
import { clsx } from 'clsx';
import { useStore } from './store/useStore';

function App() {
  const [view, setView] = useState<'configurator' | 'budget'>('budget');
  const { isLoading, initialized } = useStore();

  if (isLoading || !initialized) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-accent flex-col gap-4">
        <div className="animate-spin w-10 h-10 border-4 border-current border-t-transparent rounded-full"></div>
        <div>Cargando base de datos...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Navigation Bar */}
      <nav className="bg-surface border-b border-border p-2 flex justify-center gap-4">
        <button
          onClick={() => setView('budget')}
          className={clsx(
            "flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all",
            view === 'budget' ? "bg-accent text-emerald-950 shadow-lg shadow-emerald-900/20" : "text-gray-400 hover:text-white"
          )}
        >
          <Calculator className="w-4 h-4" />
          Presupuestador
        </button>
        <button
          onClick={() => setView('configurator')}
          className={clsx(
            "flex items-center gap-2 px-6 py-2 rounded-lg font-bold transition-all",
            view === 'configurator' ? "bg-accent text-emerald-950 shadow-lg shadow-emerald-900/20" : "text-gray-400 hover:text-white"
          )}
        >
          <Settings className="w-4 h-4" />
          Configurador
        </button>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {view === 'configurator' ? <Configurator /> : <BudgetCalculator />}
      </main>
    </div>
  );
}

export default App;
