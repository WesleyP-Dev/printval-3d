import React, { useState, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Star,
  Edit2,
  Trash2,
  TrendingUp,
  AlertTriangle,
  Package,
} from 'lucide-react';
import { Filamento, TipoMaterial } from '../types';
import { formatarMoeda } from '../utils/pdfGenerator';
import { FilamentoModal } from './FilamentoModal';

interface FilamentosTabProps {
  filamentos: Filamento[];
  onSalvarFilamento: (filamento: Filamento) => void;
  onExcluirFilamento: (id: string) => void;
  onToggleFavorito: (id: string) => void;
}

const TIPOS_FILTRO: Array<TipoMaterial | 'Todos'> = [
  'Todos',
  'PLA',
  'PETG',
  'ABS',
  'TPU',
  'ASA',
  'Resina',
  'Outro',
];

export const FilamentosTab: React.FC<FilamentosTabProps> = ({
  filamentos,
  onSalvarFilamento,
  onExcluirFilamento,
  onToggleFavorito,
}) => {
  const [busca, setBusca] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<TipoMaterial | 'Todos'>('Todos');
  const [apenasFavoritos, setApenasFavoritos] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [filamentoEditando, setFilamentoEditando] = useState<Filamento | null>(null);

  // Filtragem memoizada
  const filamentosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return filamentos.filter((f) => {
      const textoMatch =
        !termo ||
        f.nome.toLowerCase().includes(termo) ||
        f.marca.toLowerCase().includes(termo) ||
        f.corNome.toLowerCase().includes(termo);
      const tipoMatch = tipoFiltro === 'Todos' || f.tipo === tipoFiltro;
      const favMatch = !apenasFavoritos || f.favorito;
      return textoMatch && tipoMatch && favMatch;
    });
  }, [filamentos, busca, tipoFiltro, apenasFavoritos]);

  const abrirModalNovo = useCallback(() => {
    setFilamentoEditando(null);
    setModalAberto(true);
  }, []);

  const abrirModalEditar = useCallback((f: Filamento) => {
    setFilamentoEditando(f);
    setModalAberto(true);
  }, []);

  return (
    <div className="space-y-6">
      {/* Topo / Barra de Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Package className="w-6 h-6 text-sky-500" />
            <span>Catálogo de Filamentos & Insumos</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gerencie carretéis, monitore o nível restante em gramas e acompanhe a oscilação histórica de preços.
          </p>
        </div>

        <button
          onClick={abrirModalNovo}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Carretel</span>
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Busca por texto */}
        <div className="md:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por nome, marca ou cor..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-sky-500 shadow-sm"
          />
        </div>

        {/* Filtro por tipo de material */}
        <div className="md:col-span-4 flex overflow-x-auto space-x-1 scrollbar-none py-0.5">
          {TIPOS_FILTRO.map((tipo) => (
            <button
              key={tipo}
              onClick={() => setTipoFiltro(tipo)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                tipoFiltro === tipo
                  ? 'bg-sky-600 text-white shadow-sm shadow-sky-600/30'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {tipo}
            </button>
          ))}
        </div>

        {/* Alternador de Favoritos */}
        <div className="md:col-span-3 flex items-center justify-end">
          <button
            onClick={() => setApenasFavoritos(!apenasFavoritos)}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
              apenasFavoritos
                ? 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-700'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            <Star className={`w-4 h-4 ${apenasFavoritos ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
            <span>Apenas Favoritos</span>
          </button>
        </div>
      </div>

      {/* Grid de Carretéis */}
      {filamentosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
            Nenhum filamento encontrado
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Tente ajustar os filtros de busca ou clique no botão &ldquo;Novo Carretel&rdquo; para cadastrar um insumo.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filamentosFiltrados.map((filamento) => {
            const percRestante = Math.round(
              (filamento.pesoRestanteGramas / (filamento.pesoTotalGramas || 1000)) * 100
            );

            // Cor da barra de progresso
            let statusColor = 'bg-emerald-500';
            let badgeBg = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
            if (percRestante < 20) {
              statusColor = 'bg-rose-500';
              badgeBg = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
            } else if (percRestante < 40) {
              statusColor = 'bg-amber-500';
              badgeBg = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
            }

            return (
              <div
                key={filamento.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative group"
              >
                <div>
                  {/* Topo do Card: Cor, Tipo e Ação de Favorito */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      {/* Círculo de cor */}
                      <div
                        className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-700 shadow-md flex-shrink-0"
                        style={{ backgroundColor: filamento.corHex }}
                        title={`Cor: ${filamento.corNome} (${filamento.corHex})`}
                      />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            {filamento.tipo}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            {filamento.marca}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 mt-0.5">
                          {filamento.nome}
                        </h4>
                      </div>
                    </div>

                    <button
                      onClick={() => onToggleFavorito(filamento.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        filamento.favorito
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-slate-300 hover:text-slate-400 dark:text-slate-600'
                      }`}
                      title={filamento.favorito ? 'Remover favorito' : 'Favoritar'}
                    >
                      <Star className={`w-4 h-4 ${filamento.favorito ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Detalhes da Cor e Multiplicador de Risco */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl">
                    <span>
                      Cor: <strong className="text-slate-700 dark:text-slate-200">{filamento.corNome}</strong>
                    </span>
                    <span>
                      Risco:{' '}
                      <strong className="text-slate-700 dark:text-slate-200">
                        {filamento.fatorQualidadeRisco.toFixed(2)}x
                      </strong>
                    </span>
                  </div>

                  {/* Preço e Custo por Grama */}
                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <span className="text-xs text-slate-400">Preço do Carretel</span>
                      <p className="text-lg font-black text-slate-900 dark:text-white">
                        {formatarMoeda(filamento.precoAtual)}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">Por grama</span>
                      <p className="text-xs font-semibold text-sky-600 dark:text-sky-400">
                        {formatarMoeda(filamento.precoAtual / (filamento.pesoTotalGramas || 1000))}/g
                      </p>
                    </div>
                  </div>

                  {/* Barra de Progresso de Nível de Filamento */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Saldo do Carretel:
                      </span>
                      <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded border ${badgeBg}`}>
                        {filamento.pesoRestanteGramas}g ({percRestante}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${statusColor}`}
                        style={{ width: `${Math.min(100, Math.max(0, percRestante))}%` }}
                      />
                    </div>

                    {percRestante < 25 && (
                      <p className="text-[11px] text-rose-500 font-medium flex items-center space-x-1 pt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>Estoque baixo! Fatiamento pode exigir troca de carretel.</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Ações do Card */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => abrirModalEditar(filamento)}
                    className="flex items-center space-x-1 text-xs font-semibold text-sky-600 hover:text-sky-500 dark:text-sky-400"
                    title="Ver histórico temporal de preços e editar"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Histórico & Dados</span>
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => abrirModalEditar(filamento)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Deseja realmente excluir o carretel "${filamento.nome}"?`)) {
                          onExcluirFilamento(filamento.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Cadastro / Edição com Recharts */}
      <FilamentoModal
        isOpen={modalAberto}
        onClose={() => setModalAberto(false)}
        filamentoParaEditar={filamentoEditando}
        onSalvar={onSalvarFilamento}
      />
    </div>
  );
};
