import React from 'react';
import {
  X,
  FileText,
  Share2,
  Package,
  Clock,
  Weight,
  Layers,
  Laptop,
  Wrench,
  Cpu,
  ShieldCheck,
  FileCheck,
} from 'lucide-react';
import { Orcamento, ConfiguracoesGlobais } from '../types';
import { formatarMoeda, formatarData, gerarPropostaPDF } from '../utils/pdfGenerator';
import { PRESETS_SERVICOS_HARDWARE } from '../utils/pricingEngine';
import { gerarTextoWhatsApp, copiarTextoParaAreaDeTransferencia } from '../utils/whatsappShare';

interface OrcamentoDetalhesModalProps {
  orcamento: Orcamento | null;
  config: ConfiguracoesGlobais;
  onClose: () => void;
  onClonarNaCalculadora: (orcamento: Orcamento) => void;
}

export const OrcamentoDetalhesModal: React.FC<OrcamentoDetalhesModalProps> = ({
  orcamento,
  config,
  onClose,
  onClonarNaCalculadora,
}) => {
  if (!orcamento) return null;

  const res = orcamento.resultado;
  const isHardware = orcamento.categoria === 'manutencao_hardware';
  const hw = orcamento.hardwareItem;

  const handleCopiar = async () => {
    const texto = gerarTextoWhatsApp(orcamento, config);
    await copiarTextoParaAreaDeTransferencia(texto);
    alert('Texto copiado com sucesso para a área de transferência!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div>
            <div className="flex items-center space-x-2">
              <span
                className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                  isHardware
                    ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300'
                    : 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300'
                }`}
              >
                {orcamento.numero}
              </span>
              <span
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  isHardware
                    ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                    : 'bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300'
                }`}
              >
                {isHardware ? 'Bancada TI' : 'Impressão 3D'}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  orcamento.status === 'Aprovado'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : orcamento.status === 'Entregue'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    : orcamento.status === 'Cancelado'
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                }`}
              >
                {orcamento.status}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              {orcamento.projetoNome}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Dados do Cliente */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
            <div>
              <span className="text-slate-400 block">Cliente:</span>
              <strong className="text-slate-900 dark:text-white text-sm">{orcamento.clienteNome}</strong>
            </div>
            {orcamento.clienteTelefone && (
              <div>
                <span className="text-slate-400 block">Telefone / WhatsApp:</span>
                <span className="text-slate-700 dark:text-slate-300">{orcamento.clienteTelefone}</span>
              </div>
            )}
            <div>
              <span className="text-slate-400 block">Data de Criação:</span>
              <span className="text-slate-700 dark:text-slate-300">{formatarData(orcamento.dataCriacao)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Prazo Comercial:</span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold">{res.prazoFinalAdotado}</span>
            </div>
          </div>

          {/* Seção Específica de Manutenção de Hardware */}
          {isHardware && hw && (
            <div className="space-y-4">
              {/* Informações do Equipamento */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
                <div className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
                  <Laptop className="w-4 h-4 text-indigo-500" />
                  <span>Equipamento & Laudo de Entrada</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <span className="text-slate-400 block">Marca / Modelo:</span>
                    <strong className="text-slate-800 dark:text-slate-200">{hw.marca} {hw.modelo}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Nº de Série:</span>
                    <span className="text-slate-700 dark:text-slate-300">{hw.numeroSerie || 'Não informado'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Valor Estimado:</span>
                    <span className="text-slate-700 dark:text-slate-300">{formatarMoeda(hw.valorEstimadoEquipamento)}</span>
                  </div>
                </div>

                {hw.sintomasRelatados && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700/50">
                    <span className="text-slate-400 block">Sintomas / Queixa:</span>
                    <p className="text-slate-700 dark:text-slate-300 italic">{hw.sintomasRelatados}</p>
                  </div>
                )}
              </div>

              {/* Checklist de Entrada */}
              {hw.checklist && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-800/30 text-xs space-y-2">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">
                    Checklist Pericial de Entrada
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px]">
                    <span className={hw.checklist.ligaDaVideo ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'}>
                      {hw.checklist.ligaDaVideo ? '✓ Liga / Dá Vídeo' : '✗ Não liga / sem vídeo'}
                    </span>
                    <span className={hw.checklist.bateriaCarrega ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-slate-400'}>
                      {hw.checklist.bateriaCarrega ? '✓ Bateria Carrega' : '✗ Bateria Não Carrega'}
                    </span>
                    <span className={hw.checklist.telaIntegra ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-rose-500'}>
                      {hw.checklist.telaIntegra ? '✓ Tela Íntegra' : '✗ Avaria na Tela'}
                    </span>
                    <span className={hw.checklist.avariasPreexistentes ? 'text-amber-500 font-medium' : 'text-slate-400'}>
                      {hw.checklist.avariasPreexistentes ? '⚠ Riscos / Avarias' : '✓ Sem Avarias Visíveis'}
                    </span>
                    <span className={hw.checklist.parafusosFaltando ? 'text-amber-500 font-medium' : 'text-slate-400'}>
                      {hw.checklist.parafusosFaltando ? '⚠ Parafusos Faltando' : '✓ Carcaça Lacrada'}
                    </span>
                    <span className={hw.checklist.falhaConectorDobradica ? 'text-rose-500 font-medium' : 'text-slate-400'}>
                      {hw.checklist.falhaConectorDobradica ? '⚠ Conector/Dobradiça Avariada' : '✓ Mancais Íntegros'}
                    </span>
                  </div>
                </div>
              )}

              {/* Serviços Executados */}
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-800/30 text-xs space-y-2">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold flex items-center space-x-1.5">
                  <Wrench className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Serviços de Bancada & Insumos</span>
                </span>
                <div className="space-y-1">
                  {hw.servicosIds.map((sId) => {
                    const p = PRESETS_SERVICOS_HARDWARE.find((item) => item.id === sId);
                    return p ? (
                      <div key={p.id} className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                        <span>• {p.nome}</span>
                        <strong className="text-indigo-600 dark:text-indigo-400">{formatarMoeda(p.precoSugerido)}</strong>
                      </div>
                    ) : null;
                  })}
                  {hw.servicosCustomizados?.map((sc) => (
                    <div key={sc.id} className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                      <span>• {sc.nome} (Especializado)</span>
                      <strong className="text-indigo-600 dark:text-indigo-400">{formatarMoeda(sc.valor)}</strong>
                    </div>
                  ))}
                  <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                    <span>• Consumíveis de Bancada (Pasta Térmica & Higienização Química)</span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">Inclusos no serviço</span>
                  </div>
                  {hw.taxaRiscoAplicada > 0 && (
                    <div className="flex justify-between items-center text-amber-600 dark:text-amber-400">
                      <span>• Taxa de Responsabilidade Técnica (Alto Valor)</span>
                      <span>+{formatarMoeda(hw.taxaRiscoAplicada)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Peças e Upgrades */}
              {hw.pecas && hw.pecas.length > 0 && (
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/70 dark:bg-slate-800/30 text-xs space-y-2">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold flex items-center space-x-1.5">
                    <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Peças de Reposição & Upgrades</span>
                  </span>
                  <div className="space-y-1">
                    {hw.pecas.map((peca) => (
                      <div key={peca.id} className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                        <span>• {peca.descricao}</span>
                        <strong className="text-slate-800 dark:text-slate-200">{formatarMoeda(peca.precoVenda)}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Termo de Garantia CDC */}
              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-200 dark:border-indigo-800/80 flex items-start space-x-2 text-xs text-indigo-900 dark:text-indigo-200">
                <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Garantia Legal de 90 Dias (Art. 26 CDC):</strong> Os serviços e peças substituídas possuem garantia legal de 90 dias a contar da entrega.
                </span>
              </div>
            </div>
          )}

          {/* Seção Específica de Impressão 3D */}
          {!isHardware && (
            <>
              {/* Dados Técnicos 3D */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <Package className="w-4 h-4 text-sky-500 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block uppercase">Material</span>
                  <strong className="text-xs text-slate-900 dark:text-white">
                    {orcamento.filamentoSnapshot ? `${orcamento.filamentoSnapshot.tipo} (${orcamento.filamentoSnapshot.corNome})` : 'Padrão'}
                  </strong>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <Layers className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block uppercase">Quantidade</span>
                  <strong className="text-xs text-slate-900 dark:text-white">{orcamento.item?.quantidadeLote || 1} un</strong>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <Weight className="w-4 h-4 text-amber-500 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block uppercase">Consumo Total</span>
                  <strong className="text-xs text-slate-900 dark:text-white">{res.pesoTotalLoteGramas}g</strong>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <Clock className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400 block uppercase">Tempo Máquina</span>
                  <strong className="text-xs text-slate-900 dark:text-white">{res.cargaHorariaTotal}h</strong>
                </div>
              </div>

              {/* Discriminação de Cores & Partes */}
              {res.detalhamentoMateriais && res.detalhamentoMateriais.length > 1 && (
                <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">
                    Discriminação de Cores & Partes ({res.detalhamentoMateriais.length} materiais)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {res.detalhamentoMateriais.map((mat, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                      >
                        <div className="flex items-center space-x-2 truncate pr-2">
                          <span
                            className="w-3 h-3 rounded-full border shadow-xs flex-shrink-0"
                            style={{ backgroundColor: mat.corHex }}
                          />
                          <div className="truncate">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                              {mat.rotuloParte || `Parte ${idx + 1}`}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {mat.tipo} • {mat.corNome}
                            </span>
                          </div>
                        </div>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 flex-shrink-0">
                          {mat.pesoTotalGramas}g
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Setup e Acabamento */}
              <div className="flex items-center justify-between text-xs bg-indigo-50/60 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">
                    Nível de Acabamento & Setup
                  </span>
                  <span className="font-semibold">{res.complexidadeRotulo || 'Padrão'}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">
                    Mão de Obra Total
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">
                    {formatarMoeda(res.custoMaoDeObraTotal)}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Resumo Financeiro Comum */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2.5">
            <div className="flex justify-between items-baseline border-b border-slate-800 pb-2">
              <span className="text-xs text-slate-400">Cartão 1x (À vista sem juros):</span>
              <span className="text-base font-bold text-slate-100">{formatarMoeda(res.precoFinalPadraoTotal)}</span>
            </div>

            {res.parcelasCartao && res.parcelasCartao > 1 && (
              <div className="flex justify-between items-baseline border-b border-slate-800 pb-2 text-indigo-300">
                <span className="text-xs">
                  Cartão Parcelado ({res.parcelasCartao}x com +{res.taxaJurosCartaoPercentual}%):
                </span>
                <span className="text-sm font-bold">
                  {res.parcelasCartao}x de {formatarMoeda(res.valorParcelaIndividual || 0)}
                  <span className="text-[10px] text-slate-400 font-normal ml-1">
                    ({formatarMoeda(res.valorTotalParcelado || 0)})
                  </span>
                </span>
              </div>
            )}

            {res.valorDescontoComercialTotal > 0 && (
              <div className="flex justify-between items-baseline text-xs text-emerald-400">
                <span>Desconto Comercial Concedido:</span>
                <span className="font-semibold">-{formatarMoeda(res.valorDescontoComercialTotal)}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-xs text-emerald-400 font-semibold">
                Preço Especial À VISTA ({res.descontoAVistaPercentual}% OFF):
              </span>
              <span className="text-2xl font-black text-emerald-400">{formatarMoeda(res.precoFinalAVistaTotal)}</span>
            </div>
          </div>
        </div>

        {/* Rodapé com Ações */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={() => {
              onClonarNaCalculadora(orcamento);
              onClose();
            }}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {isHardware ? 'Abrir / Editar na Bancada' : 'Abrir / Reprecificar na Calculadora'}
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopiar}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            {isHardware ? (
              <>
                <button
                  onClick={() => void gerarPropostaPDF(orcamento, config, { modoHardware: 'orcamento' })}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 transition-colors"
                  title="Baixar Orçamento Comercial preliminar (sem laudo/termos)"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Orçamento (PDF)</span>
                </button>

                <button
                  onClick={() => void gerarPropostaPDF(orcamento, config, { modoHardware: 'termo_os' })}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                  title="Baixar Ordem de Serviço completa com laudo e termo CDC"
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Termo & OS (PDF)</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => void gerarPropostaPDF(orcamento, config)}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Baixar PDF</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

