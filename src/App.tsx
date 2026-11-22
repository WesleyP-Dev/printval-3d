import React, { useState, useEffect, useCallback } from 'react';
import { Navbar, TabId } from './components/Navbar';
import { CalculadoraTab } from './components/CalculadoraTab';
import { FilamentosTab } from './components/FilamentosTab';
import { HistoricoTab } from './components/HistoricoTab';
import { BreakEvenTab } from './components/BreakEvenTab';
import { ConfiguracoesModal } from './components/ConfiguracoesModal';
import { AppDataState, Filamento, Orcamento, ConfiguracoesGlobais, StatusOrcamento } from './types';
import { getStoredData, subscribeToData, updateFilamentos, updateOrcamentos, updateConfiguracoes } from './services/storageService';

export const App: React.FC = () => {
  const [dataState, setDataState] = useState<AppDataState>(getStoredData());
  const [activeTab, setActiveTab] = useState<TabId>('calculadora');
  const [orcamentoParaClonar, setOrcamentoParaClonar] = useState<Orcamento | null>(null);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem('printval_dark_mode') === 'true');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('printval_dark_mode', String(darkMode));
  }, [darkMode]);

  useEffect(() => {
    return subscribeToData((novoEstado) => setDataState(novoEstado));
  }, []);

  const handleSalvarFilamento = useCallback((filamento: Filamento) => {
    setDataState((prev) => {
      const idx = prev.filamentos.findIndex((f) => f.id === filamento.id);
      const novos = idx >= 0 ? prev.filamentos.map((f, i) => (i === idx ? filamento : f)) : [filamento, ...prev.filamentos];
      updateFilamentos(novos);
      return { ...prev, filamentos: novos };
    });
  }, []);

  const handleExcluirFilamento = useCallback((id: string) => {
    setDataState((prev) => {
      const novos = prev.filamentos.filter((f) => f.id !== id);
      updateFilamentos(novos);
      return { ...prev, filamentos: novos };
    });
  }, []);

  const handleToggleFavorito = useCallback((id: string) => {
    setDataState((prev) => {
      const novos = prev.filamentos.map((f) => (f.id === id ? { ...f, favorito: !f.favorito } : f));
      updateFilamentos(novos);
      return { ...prev, filamentos: novos };
    });
  }, []);

  const handleSalvarOrcamento = useCallback((orcamento: Orcamento) => {
    setDataState((prev) => {
      const novos = [orcamento, ...prev.orcamentos];
      updateOrcamentos(novos);
      return { ...prev, orcamentos: novos };
    });
  }, []);

  const handleAlterarStatus = useCallback((id: string, novoStatus: StatusOrcamento) => {
    setDataState((prev) => {
      const novos = prev.orcamentos.map((o) => (o.id === id ? { ...o, status: novoStatus } : o));
      updateOrcamentos(novos);
      return { ...prev, orcamentos: novos };
    });
  }, []);

  const handleExcluirOrcamento = useCallback((id: string) => {
    setDataState((prev) => {
      const novos = prev.orcamentos.filter((o) => o.id !== id);
      updateOrcamentos(novos);
      return { ...prev, orcamentos: novos };
    });
  }, []);

  const handleClonar = useCallback((orcamento: Orcamento) => {
    setOrcamentoParaClonar(orcamento);
    setActiveTab('calculadora');
  }, []);

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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === 'calculadora' && (
          <CalculadoraTab
            filamentos={dataState.filamentos}
            configuracoes={dataState.configuracoes}
            onSalvarOrcamento={handleSalvarOrcamento}
            orcamentoParaClonar={orcamentoParaClonar}
            onLimparClonagem={() => setOrcamentoParaClonar(null)}
          />
        )}
        {activeTab === 'filamentos' && (
          <FilamentosTab
            filamentos={dataState.filamentos}
            onSalvarFilamento={handleSalvarFilamento}
            onExcluirFilamento={handleExcluirFilamento}
            onToggleFavorito={handleToggleFavorito}
          />
        )}
        {activeTab === 'historico' && (
          <HistoricoTab
            orcamentos={dataState.orcamentos}
            configuracoes={dataState.configuracoes}
            onAlterarStatus={handleAlterarStatus}
            onExcluirOrcamento={handleExcluirOrcamento}
            onClonarOrcamento={handleClonar}
          />
        )}
        {activeTab === 'breakeven' && (
          <BreakEvenTab
            orcamentos={dataState.orcamentos}
            configuracoes={dataState.configuracoes}
            onAtualizarConfig={(c: ConfiguracoesGlobais) => updateConfiguracoes(c)}
          />
        )}
      </main>
      <ConfiguracoesModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        config={dataState.configuracoes}
        onSalvarConfig={(c: ConfiguracoesGlobais) => updateConfiguracoes(c)}
        isDriveConnected={false}
        onConectarDrive={() => {}}
        onDesconectarDrive={() => {}}
      />
    </div>
  );
};

export default App;
