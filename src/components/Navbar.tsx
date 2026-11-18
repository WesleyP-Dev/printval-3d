import React from 'react';
import {
  Calculator,
  Laptop,
  Layers,
  History,
  TrendingUp,
  Settings,
  Sun,
  Moon,
  Cloud,
  CloudCheck,
  CloudAlert,
  Sparkles,
  Trash2,
  Download,
  Upload,
} from 'lucide-react';
import { exportarArquivoJSON } from '../services/storageService';

export type TabId = 'calculadora' | 'manutencao' | 'filamentos' | 'historico' | 'breakeven';

interface NavbarProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenConfig: () => void;
  onCarregarDemo: () => void;
  onLimparDados: () => void;
  onImportarJSON: () => void;
  isDriveConnected: boolean;
  isDriveSyncing: boolean;
  onSyncDrive: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  darkMode,
  setDarkMode,
  onOpenConfig,
  onCarregarDemo,
  onLimparDados,
  onImportarJSON,
  isDriveConnected,
  isDriveSyncing,
  onSyncDrive,
}) => {
  const tabs = [
    { id: 'calculadora' as TabId, label: 'Calculadora 3D', icon: Calculator },
    { id: 'manutencao' as TabId, label: 'Bancada TI', icon: Laptop },
    { id: 'filamentos' as TabId, label: 'Filamentos', icon: Layers },
    { id: 'historico' as TabId, label: 'Histórico & Pedidos', icon: History },
    { id: 'breakeven' as TabId, label: 'Ponto de Equilíbrio', icon: TrendingUp },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Marca */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('calculadora')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-sky-500/20">
              <Layers className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  PrintVal<span className="text-sky-500">3D</span>
                </span>
                <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                  Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium -mt-0.5">
                Precificação & Gestão de Manufatura 3D
              </p>
            </div>
          </div>

          {/* Navegação Desktop */}
          <nav className="hidden md:flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-50 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600 dark:text-sky-400' : ''}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Ações Rápidas & Configurações */}
          <div className="flex items-center space-x-2">
            {/* Sincronização Google Drive */}
            <button
              onClick={onSyncDrive}
              title={
                isDriveConnected
                  ? 'Conectado ao Google Drive (Clique para sincronizar sob demanda)'
                  : 'Sincronizar com Google Drive (OAuth 2.0)'
              }
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                isDriveConnected
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                  : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:border-sky-400'
              }`}
            >
              {isDriveSyncing ? (
                <Cloud className="w-3.5 h-3.5 animate-spin text-sky-500" />
              ) : isDriveConnected ? (
                <CloudCheck className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <CloudAlert className="w-3.5 h-3.5 text-amber-500" />
              )}
              <span className="hidden lg:inline">
                {isDriveSyncing
                  ? 'Sincronizando...'
                  : isDriveConnected
                  ? 'Drive Ativo'
                  : 'Sincronizar Drive'}
              </span>
            </button>

            {/* Ações de Dados: Exportar & Importar */}
            <button
              onClick={() => exportarArquivoJSON()}
              title="Exportar arquivo .JSON de backup"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onImportarJSON}
              title="Importar arquivo .JSON salvo"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Upload className="w-4 h-4" />
            </button>

            {/* Dados de Demonstração (Mocks Pré-Carregados) */}
            <div className="hidden sm:flex items-center space-x-1 pl-1 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={onCarregarDemo}
                title="Carregar Dados de Demonstração (Filamentos & Orçamentos)"
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Demo Mocks</span>
              </button>

              <button
                onClick={onLimparDados}
                title="Limpar todos os dados locais"
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Alternador Dark/Light */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Mudar para Modo Claro' : 'Mudar para Modo Escuro'}
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            </button>

            {/* Botão de Configurações */}
            <button
              onClick={onOpenConfig}
              title="Configurações Globais da Oficina"
              className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navegação Mobile (inferior ou linha secundária) */}
      <div className="md:hidden flex overflow-x-auto border-t border-slate-200 dark:border-slate-800 px-2 py-1 space-x-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                isActive
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
};
