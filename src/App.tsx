import React, { useState, useEffect } from 'react';
import { Navbar, TabId } from './components/Navbar';
import { ConfiguracoesModal } from './components/ConfiguracoesModal';
import { AppDataState, ConfiguracoesGlobais } from './types';
import { getStoredData, subscribeToData, updateConfiguracoes } from './services/storageService';

export const App: React.FC = () => {
  const [dataState, setDataState] = useState<AppDataState>(getStoredData());
  const [activeTab, setActiveTab] = useState<TabId>('calculadora');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem('printval_dark_mode') === 'true');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('printval_dark_mode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    return subscribeToData((novoEstado) => setDataState(novoEstado));
  }, []);

  const handleSalvarConfig = (novaConfig: ConfiguracoesGlobais) => {
    updateConfiguracoes(novaConfig);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Navbar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode((d) => !d)}
        onOpenConfig={() => setIsConfigOpen(true)}
        isDriveConnected={false}
        isDriveSyncing={false}
        onSyncClick={() => setIsConfigOpen(true)}
        onExportJSON={() => {}}
        onImportJSON={() => {}}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center">
          <h2 className="text-lg font-bold">Módulos de Navegação, Configurações e Exportação Prontos</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gerador de PDF (jsPDF), compartilhamento WhatsApp e painel de configurações globais integrados.
          </p>
        </div>
      </main>
      <ConfiguracoesModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={dataState.configuracoes}
        onSalvarConfig={handleSalvarConfig}
        isDriveConnected={false}
        onConectarDrive={() => {}}
        onDesconectarDrive={() => {}}
      />
    </div>
  );
};

export default App;
