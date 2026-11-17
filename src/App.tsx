import React, { useState } from 'react';
import { getStoredData } from './services/storageService';

export const App: React.FC = () => {
  const [dataState] = useState(getStoredData());

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="border-b border-slate-200 dark:border-slate-800 pb-4">
          <h1 className="text-2xl font-bold text-sky-600 dark:text-sky-400">
            PrintVal 3D — Motor de Precificação
          </h1>
          <p className="text-sm text-slate-500">
            Estrutura inicial, tipagem TypeScript e motor de cálculo financeiro configurados.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 block">Filamentos Carregados</span>
            <strong className="text-xl">{dataState.filamentos.length}</strong>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 block">Orçamentos Base</span>
            <strong className="text-xl">{dataState.orcamentos.length}</strong>
          </div>
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="text-xs text-slate-400 block">Margem Base</span>
            <strong className="text-xl">{dataState.configuracoes.margemLucroBase}%</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
