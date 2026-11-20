import React, { useState, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  Eye,
  FileText,
  Share2,
  Trash2,
  Copy,
  Package,
  Layers,
  Laptop,
  Wrench,
  FileCheck,
} from 'lucide-react';
import { Orcamento, StatusOrcamento, ConfiguracoesGlobais, CategoriaOrcamento } from '../types';
import { formatarMoeda, formatarData, gerarPropostaPDF } from '../utils/pdfGenerator';
import { gerarTextoWhatsApp, copiarTextoParaAreaDeTransferencia } from '../utils/whatsappShare';
import { OrcamentoDetalhesModal } from './OrcamentoDetalhesModal';

interface HistoricoTabProps {
  orcamentos: Orcamento[];
  config: ConfiguracoesGlobais;
  onAtualizarStatus: (id: string, novoStatus: StatusOrcamento, descontarEstoque?: boolean) => void;
  onExcluirOrcamento: (id: string) => void;
  onClonarNaCalculadora: (orcamento: Orcamento) => void;
}

const STATUS_LISTA: Array<StatusOrcamento | 'Todos'> = [
  'Todos',
  'Pendente',
  'Aprovado',
  'Entregue',
  'Cancelado',
];

export const HistoricoTab: React.FC<HistoricoTabProps> = ({
  orcamentos,
  config,
  onAtualizarStatus,
  onExcluirOrcamento,
  onClonarNaCalculadora,
}) => {
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<CategoriaOrcamento | 'todos'>('todos');
  const [statusFiltro, setStatusFiltro] = useState<StatusOrcamento | 'Todos'>('Todos');
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<Orcamento | null>(null);

  // Contagens por categoria
  const contagemTotal = orcamentos.length;
  const contagem3D = useMemo(
    () => orcamentos.filter((o) => !o.categoria || o.categoria === 'impressao_3d').length,
    [orcamentos]
  );
  const contagemHardware = useMemo(
    () => orcamentos.filter((o) => o.categoria === 'manutencao_hardware').length,
    [orcamentos]
  );

  // Filtragem combinada memoizada (Categoria + Status + Busca)
  const orcamentosFiltrados = useMemo(() => {
    const termo = busca.toLowerCase().trim();
    return orcamentos.filter((o) => {
      // Filtro por Categoria
      const matchCategoria =
        categoriaFiltro === 'todos'
          ? true
          : categoriaFiltro === 'manutencao_hardware'
          ? o.categoria === 'manutencao_hardware'
          : !o.categoria || o.categoria === 'impressao_3d';

      // Filtro por Status
      const matchStatus = statusFiltro === 'Todos' || o.status === statusFiltro;

      // Filtro por Busca
      const matchBusca =
        !termo ||
        o.numero.toLowerCase().includes(termo) ||
        o.clienteNome.toLowerCase().includes(termo) ||
        o.projetoNome.toLowerCase().includes(termo) ||
        (o.hardwareItem &&
          (o.hardwareItem.marca?.toLowerCase().includes(termo) ||
            o.hardwareItem.modelo?.toLowerCase().includes(termo) ||
            o.hardwareItem.numeroSerie?.toLowerCase().includes(termo)));

      return matchCategoria && matchStatus && matchBusca;
    });
  }, [orcamentos, categoriaFiltro, statusFiltro, busca]);

  const handleStatusChange = useCallback((orc: Orcamento, novoStatus: StatusOrcamento) => {
    // Apenas orçamentos de impressão 3D realizam baixa em gramas de filamento
    if (orc.categoria !== 'manutencao_hardware' && novoStatus === 'Aprovado' && !orc.descontouEstoque) {
      const detalhes = orc.resultado.detalhamentoMateriais;
      let mensagemConfirmacao = '';

      if (detalhes && detalhes.length > 1) {
        const listaTexto = detalhes
          .map((d) => `• ${d.tipo} ${d.corNome} (${d.marca}): ${d.pesoTotalGramas}g`)
          .join('\n');
        mensagemConfirmacao = `Deseja abater os seguintes materiais do estoque automaticamente?\n\n${listaTexto}\n\nPeso Total Consolidado: ${orc.resultado.pesoTotalLoteGramas}g`;
      } else {
        const mat = detalhes?.[0];
        const nomeFil = mat ? `${mat.tipo} ${mat.corNome}` : (orc.filamentoSnapshot?.nome || 'Carretel');
        mensagemConfirmacao = `Deseja abater ${orc.resultado.pesoTotalLoteGramas}g do saldo do carretel "${nomeFil}" automaticamente?`;
      }

      const confirmDeducao = confirm(mensagemConfirmacao);
      onAtualizarStatus(orc.id, novoStatus, confirmDeducao);
    } else {
      onAtualizarStatus(orc.id, novoStatus, false);
    }
  }, [onAtualizarStatus]);

  const handleCopiarWhatsApp = useCallback(async (orc: Orcamento) => {
    const texto = gerarTextoWhatsApp(orc, config);
    await copiarTextoParaAreaDeTransferencia(texto);
    alert('Mensagem formatada copiada para a área de transferência!');
  }, [config]);

  return (
    <div className="space-y-6">
      {/* Topo do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Package className="w-6 h-6 text-sky-500" />
            <span>Histórico de Orçamentos & Ordens de Serviço</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhe o funil de cotações, reemita propostas e termos periciais em PDF, envie mensagens pelo WhatsApp e gerencie status.
          </p>
        </div>

        {/* Resumo Rápido */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
            Total: <strong>{contagemTotal}</strong>
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800">
            Aprovados:{' '}
            <strong>{orcamentos.filter((o) => o.status === 'Aprovado').length}</strong>
          </span>
        </div>
      </div>

      {/* Segmentação por Categoria de Serviço */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <button
            type="button"
            onClick={() => setCategoriaFiltro('todos')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              categoriaFiltro === 'todos'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>Todos os Serviços</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {contagemTotal}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCategoriaFiltro('impressao_3d')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              categoriaFiltro === 'impressao_3d'
                ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Impressão 3D</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                categoriaFiltro === 'impressao_3d'
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {contagem3D}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCategoriaFiltro('manutencao_hardware')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              categoriaFiltro === 'manutencao_hardware'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Serviços de Bancada</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                categoriaFiltro === 'manutencao_hardware'
                  ? 'bg-indigo-700 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {contagemHardware}
            </span>
          </button>
        </div>
      </div>

      {/* Barra de Busca e Filtros de Status */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Buscar por cliente, projeto, modelo ou nº da OS (ex: OS-2026)..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
        </div>

        <div className="md:col-span-6 flex items-center space-x-1 overflow-x-auto scrollbar-none py-0.5">
          <Filter className="w-4 h-4 text-slate-400 mr-1 flex-shrink-0" />
          {STATUS_LISTA.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFiltro(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFiltro === st
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Tabela de Orçamentos */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {orcamentosFiltrados.length === 0 ? (
          <div className="text-center py-16 p-6">
            <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
              Nenhum registro encontrado
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Crie uma cotação na Calculadora 3D ou na Bancada de Hardware para registrar pedidos no histórico.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="px-4 py-3">Orçamento / Categoria</th>
                  <th className="px-4 py-3">Cliente / Equipamento</th>
                  <th className="px-4 py-3">Especificação & Detalhes</th>
                  <th className="px-4 py-3">Valor Padrão</th>
                  <th className="px-4 py-3">À Vista (Pix)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {orcamentosFiltrados.map((orc) => {
                  const isHw = orc.categoria === 'manutencao_hardware';
                  const fil = orc.filamentoSnapshot;
                  const res = orc.resultado;
                  const qtd = orc.item?.quantidadeLote || 1;
                  const hw = orc.hardwareItem;

                  return (
                    <tr
                      key={orc.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Número, Categoria & Data */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span className={`font-mono font-bold block ${isHw ? 'text-indigo-600 dark:text-indigo-400' : 'text-sky-600 dark:text-sky-400'}`}>
                            {orc.numero}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold border inline-flex items-center gap-1 ${
                              isHw
                                ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                                : 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                            }`}
                          >
                            {isHw ? <Laptop className="w-2.5 h-2.5" /> : <Layers className="w-2.5 h-2.5" />}
                            {isHw ? 'Bancada TI' : 'Impressão 3D'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {formatarData(orc.dataCriacao)}
                        </span>
                      </td>

                      {/* Cliente / Projeto */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {orc.clienteNome}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          {isHw && hw ? `${hw.marca} ${hw.modelo}` : orc.projetoNome}
                        </div>
                      </td>

                      {/* Especificação / Materiais ou Serviços */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        {isHw && hw ? (
                          <div>
                            <div className="flex items-center space-x-1.5 font-semibold text-slate-800 dark:text-slate-200">
                              <Wrench className="w-3.5 h-3.5 text-indigo-500" />
                              <span>{hw.servicosIds.length + (hw.servicosCustomizados?.length || 0)} serviço(s)</span>
                              {hw.pecas && hw.pecas.length > 0 && (
                                <span className="text-slate-400 font-normal">
                                  • {hw.pecas.length} peça(s)
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block">
                              Prazo: {res.prazoFinalAdotado}
                            </span>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center space-x-1.5">
                              {res.detalhamentoMateriais && res.detalhamentoMateriais.length > 1 ? (
                                <div className="flex -space-x-1 overflow-hidden">
                                  {res.detalhamentoMateriais.map((d, i) => (
                                    <div
                                      key={i}
                                      className="w-3.5 h-3.5 rounded-full border border-white dark:border-slate-800 shadow-xs"
                                      style={{ backgroundColor: d.corHex }}
                                      title={`${d.rotuloParte || d.corNome} (${d.pesoTotalGramas}g)`}
                                    />
                                  ))}
                                </div>
                              ) : fil ? (
                                <div
                                  className="w-3.5 h-3.5 rounded-full border shadow-xs"
                                  style={{ backgroundColor: fil.corHex }}
                                  title={fil.corNome}
                                />
                              ) : null}
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {res.detalhamentoMateriais && res.detalhamentoMateriais.length > 1
                                  ? `${res.detalhamentoMateriais.length} Cores`
                                  : fil?.tipo || 'PLA'}
                              </span>
                              <span className="text-slate-400">({qtd} un)</span>
                            </div>
                            <span className="text-[11px] text-slate-400 block">
                              {res.pesoTotalLoteGramas}g • {res.cargaHorariaTotal}h
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Valor Padrão */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-semibold text-slate-700 dark:text-slate-300">
                        {formatarMoeda(res.precoFinalPadraoTotal)}
                      </td>

                      {/* Valor À Vista */}
                      <td className="px-4 py-3.5 whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400">
                        {formatarMoeda(res.precoFinalAVistaTotal)}
                      </td>

                      {/* Status Dropdown */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <select
                          value={orc.status}
                          onChange={(e) =>
                            handleStatusChange(orc, e.target.value as StatusOrcamento)
                          }
                          className={`text-xs font-bold px-2 py-1 rounded-lg border cursor-pointer ${
                            orc.status === 'Aprovado'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700'
                              : orc.status === 'Entregue'
                              ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-700'
                              : orc.status === 'Cancelado'
                              ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-700'
                              : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-700'
                          }`}
                        >
                          <option value="Pendente">⏳ Pendente</option>
                          <option value="Aprovado">✅ Aprovado</option>
                          <option value="Entregue">📦 Entregue</option>
                          <option value="Cancelado">❌ Cancelado</option>
                        </select>
                        {orc.descontouEstoque && (
                          <span
                            className="block text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5"
                            title="Estoque em gramas abatido do carretel"
                          >
                            ✓ Estoque baixado
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3.5 whitespace-nowrap text-right space-x-1">
                        <button
                          onClick={() => setOrcamentoSelecionado(orc)}
                          title="Visualizar Detalhes"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onClonarNaCalculadora(orc)}
                          title={isHw ? "Editar / Reabrir na Bancada" : "Clonar / Reprecificar na Calculadora"}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {isHw ? (
                          <>
                            <button
                              onClick={() => void gerarPropostaPDF(orc, config, { modoHardware: 'orcamento' })}
                              title="Baixar Orçamento Comercial (PDF)"
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => void gerarPropostaPDF(orc, config, { modoHardware: 'termo_os' })}
                              title="Baixar Ordem de Serviço & Termo de Entrada (PDF)"
                              className="p-1.5 rounded-lg text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                            >
                              <FileCheck className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => void gerarPropostaPDF(orc, config)}
                            title="Baixar Proposta Comercial em PDF"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleCopiarWhatsApp(orc)}
                          title="Copiar para WhatsApp"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Deseja realmente excluir o registro "${orc.numero}"?`)) {
                              onExcluirOrcamento(orc.id);
                            }
                          }}
                          title="Excluir Registro"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      <OrcamentoDetalhesModal
        orcamento={orcamentoSelecionado}
        config={config}
        onClose={() => setOrcamentoSelecionado(null)}
        onClonarNaCalculadora={onClonarNaCalculadora}
      />
    </div>
  );
};
