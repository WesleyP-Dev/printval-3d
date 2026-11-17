import { AppDataState, Filamento, Orcamento, ConfiguracoesGlobais } from '../types';
import { mockInitialState, mockFilamentos, mockOrcamentos, mockConfiguracoes } from '../data/mockData';

const STORAGE_KEY = 'printval_3d_data_v1';
const LISTENERS: Array<(state: AppDataState) => void> = [];

export function getStoredData(): AppDataState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Primeira inicialização: salvar mockData como inicial
      saveStoredData(mockInitialState);
      return mockInitialState;
    }
    const parsed = JSON.parse(raw) as AppDataState;
    if (!parsed.filamentos || !parsed.orcamentos || !parsed.configuracoes) {
      return mockInitialState;
    }
    return parsed;
  } catch (e) {
    console.error('Erro ao ler localStorage, utilizando dados padrão:', e);
    return mockInitialState;
  }
}

export function saveStoredData(data: AppDataState): void {
  try {
    const dataWithTimestamp = {
      ...data,
      ultimaSincronizacao: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithTimestamp));
    notificarMudanca(dataWithTimestamp);
  } catch (e) {
    console.error('Erro ao salvar no localStorage:', e);
  }
}

export function subscribeToData(callback: (state: AppDataState) => void): () => void {
  LISTENERS.push(callback);
  return () => {
    const index = LISTENERS.indexOf(callback);
    if (index > -1) {
      LISTENERS.splice(index, 1);
    }
  };
}

function notificarMudanca(state: AppDataState) {
  LISTENERS.forEach((listener) => {
    try {
      listener(state);
    } catch (err) {
      console.error('Erro ao executar listener de storage:', err);
    }
  });
}

// Métodos auxiliares para atualizações pontuais
export function updateFilamentos(filamentos: Filamento[]): void {
  const atual = getStoredData();
  saveStoredData({ ...atual, filamentos });
}

export function updateOrcamentos(orcamentos: Orcamento[]): void {
  const atual = getStoredData();
  saveStoredData({ ...atual, orcamentos });
}

export function updateConfiguracoes(configuracoes: ConfiguracoesGlobais): void {
  const atual = getStoredData();
  saveStoredData({ ...atual, configuracoes });
}

// Resetar para dados de demonstração
export function carregarDadosMock(): AppDataState {
  const state: AppDataState = {
    filamentos: [...mockFilamentos],
    orcamentos: [...mockOrcamentos],
    configuracoes: { ...mockConfiguracoes },
    ultimaSincronizacao: new Date().toISOString(),
  };
  saveStoredData(state);
  return state;
}

// Limpar todos os dados
export function limparTodosDados(): AppDataState {
  const state: AppDataState = {
    filamentos: [],
    orcamentos: [],
    configuracoes: { ...mockConfiguracoes },
    ultimaSincronizacao: new Date().toISOString(),
  };
  saveStoredData(state);
  return state;
}

// Exportar arquivo JSON
export function exportarArquivoJSON(state?: AppDataState): void {
  const dados = state || getStoredData();
  const jsonStr = JSON.stringify(dados, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `precificacao_3d_data_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Importar arquivo JSON
export function importarArquivoJSON(file: File): Promise<AppDataState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const conteudo = event.target?.result as string;
        const parsed = JSON.parse(conteudo) as AppDataState;

        if (!Array.isArray(parsed.filamentos) || !Array.isArray(parsed.orcamentos) || !parsed.configuracoes) {
          throw new Error('Formato JSON inválido. Certifique-se de usar um arquivo exportado pela aplicação.');
        }

        saveStoredData(parsed);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
  });
}
