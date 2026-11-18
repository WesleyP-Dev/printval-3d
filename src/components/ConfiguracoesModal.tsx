import React, { useState } from 'react';
import { X, Save, Plus, Trash2, Cloud, Sliders } from 'lucide-react';
import { ConfiguracoesGlobais, RegraDescontoLote } from '../types';

interface ConfiguracoesModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: ConfiguracoesGlobais;
  onSalvarConfig: (novaConfig: ConfiguracoesGlobais) => void;
  isDriveConnected: boolean;
  onConectarDrive: () => void;
  onDesconectarDrive: () => void;
}

export const ConfiguracoesModal: React.FC<ConfiguracoesModalProps> = ({
  isOpen,
  onClose,
  config,
  onSalvarConfig,
  isDriveConnected,
  onConectarDrive,
  onDesconectarDrive,
}) => {
  const [formData, setFormData] = useState<ConfiguracoesGlobais>({
    ...config,
    taxaSetupFixo: config.taxaSetupFixo !== undefined ? config.taxaSetupFixo : 8.0,
    presetsComplexidade: config.presetsComplexidade || {
      nenhum: 0.0,
      simples: 6.0,
      medio: 14.0,
      complexo: 28.0,
    },
    custoPastaTermica: config.custoPastaTermica ?? 10.0,
    custoInsumosBancada: config.custoInsumosBancada ?? 6.0,
    markupPadraoPecas: config.markupPadraoPecas ?? 20,
    percentualTaxaRiscoHardware: config.percentualTaxaRiscoHardware ?? 3,
    limiteAltoValorHardware: config.limiteAltoValorHardware ?? 5000.0,
    taxaJurosCartao2a6: config.taxaJurosCartao2a6 ?? 5.5,
    taxaJurosCartao7a12: config.taxaJurosCartao7a12 ?? 10.5,
  });
  const [abaAtiva, setAbaAtiva] = useState<'operacional' | 'bancada' | 'descontos' | 'empresa' | 'nuvem'>('operacional');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSalvarConfig(formData);
    onClose();
  };

  // Gerenciamento de Regras de Desconto de Lote
  const adicionarRegraLote = () => {
    const novaRegra: RegraDescontoLote = {
      minUnidades: 10,
      maxUnidades: 20,
      percentualDesconto: 10,
    };
    setFormData({
      ...formData,
      regrasDescontoLote: [...formData.regrasDescontoLote, novaRegra],
    });
  };

  const removerRegraLote = (index: number) => {
    const novas = formData.regrasDescontoLote.filter((_, idx) => idx !== index);
    setFormData({ ...formData, regrasDescontoLote: novas });
  };

  const atualizarRegraLote = (index: number, campo: keyof RegraDescontoLote, valor: number) => {
    const novas = [...formData.regrasDescontoLote];
    novas[index] = { ...novas[index], [campo]: valor };
    setFormData({ ...formData, regrasDescontoLote: novas });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-sky-500" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Configurações do Motor & Oficina 3D
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Abas */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 pt-2 bg-slate-50 dark:bg-slate-800/40 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setAbaAtiva('operacional')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              abaAtiva === 'operacional'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Custos 3D
          </button>
          <button
            onClick={() => setAbaAtiva('bancada')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              abaAtiva === 'bancada'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Bancada Hardware & TI
          </button>
          <button
            onClick={() => setAbaAtiva('descontos')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              abaAtiva === 'descontos'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Escala & Arredondamento
          </button>
          <button
            onClick={() => setAbaAtiva('empresa')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              abaAtiva === 'empresa'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Dados da Oficina / Pix
          </button>
          <button
            onClick={() => setAbaAtiva('nuvem')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              abaAtiva === 'nuvem'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Google Drive API
          </button>
        </div>

        {/* Conteúdo */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* ABA 1: OPERACIONAL */}
          {abaAtiva === 'operacional' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Custo kWh */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Custo da Energia Elétrica (R$/kWh):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.custoKwh}
                  onChange={(e) =>
                    setFormData({ ...formData, custoKwh: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                />
                <span className="text-[11px] text-slate-400">Tarifa média na conta de luz</span>
              </div>

              {/* Potência W */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Potência Média da Impressora (Watts):
                </label>
                <input
                  type="number"
                  step="10"
                  min="50"
                  value={formData.potenciaImpressoraW}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      potenciaImpressoraW: parseInt(e.target.value) || 250,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                />
                <span className="text-[11px] text-slate-400">Ex: 150W a 350W</span>
              </div>

              {/* Taxa Depreciação / Manutenção */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Taxa Depreciação & Manutenção (R$/hora):
                </label>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  value={formData.taxaDepreciacaoManutencaoHora}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      taxaDepreciacaoManutencaoHora: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                />
                <span className="text-[11px] text-slate-400">Bicos, correias, lubrificação, desgaste</span>
              </div>

              {/* Margem de Lucro Base */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Margem de Lucro Bruta Padrão (%):
                </label>
                <input
                  type="number"
                  step="5"
                  min="5"
                  max="300"
                  value={formData.margemLucroBase}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      margemLucroBase: parseFloat(e.target.value) || 45,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-sky-600 dark:text-sky-400"
                />
                <span className="text-[11px] text-slate-400">Aplicada sobre o custo direto total</span>
              </div>

              {/* Taxa Horária Operador */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Taxa Horária do Operador (R$/hora):
                </label>
                <input
                  type="number"
                  step="5"
                  min="0"
                  value={formData.taxaHorariaOperador}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      taxaHorariaOperador: parseFloat(e.target.value) || 35,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                />
                <span className="text-[11px] text-slate-400">Usada no modo de pós-processo manual por minutos</span>
              </div>

              {/* Taxa Fixa de Preparação/Setup */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Taxa Fixa de Preparação/Setup (R$):
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={formData.taxaSetupFixo}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      taxaSetupFixo: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-indigo-600 dark:text-indigo-400"
                />
                <span className="text-[11px] text-slate-400">Cobrada 1x por lote de produção (setup de máquina e arquivo)</span>
              </div>

              {/* Presets de Complexidade de Acabamento */}
              <div className="sm:col-span-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-xs uppercase tracking-wider">
                  Presets de Complexidade / Pós-Processamento (R$ por peça)
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Nenhum */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nenhum (R$):
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={formData.presetsComplexidade?.nenhum ?? 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          presetsComplexidade: {
                            ...formData.presetsComplexidade,
                            nenhum: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Direto da mesa</span>
                  </div>

                  {/* Simples */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Simples (R$):
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={formData.presetsComplexidade?.simples ?? 6}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          presetsComplexidade: {
                            ...formData.presetsComplexidade,
                            simples: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Pouco suporte/brim</span>
                  </div>

                  {/* Médio */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Médio (R$):
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={formData.presetsComplexidade?.medio ?? 14}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          presetsComplexidade: {
                            ...formData.presetsComplexidade,
                            medio: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Suporte moderado</span>
                  </div>

                  {/* Complexo */}
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Complexo (R$):
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      value={formData.presetsComplexidade?.complexo ?? 28}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          presetsComplexidade: {
                            ...formData.presetsComplexidade,
                            complexo: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">Miniaturas/delicado</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA BANCADA: MANUTENÇÃO DE COMPUTADORES & TI */}
          {abaAtiva === 'bancada' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200">
                <span className="font-bold block text-sm mb-0.5">Parâmetros de Manutenção de Computadores & TI</span>
                <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
                  Configure os custos padrões de insumos de bancada, margem padrão de revenda de peças e taxa técnica de responsabilidade sobre equipamentos de alto valor.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pasta Térmica */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Custo Padrão Pasta Térmica (R$):
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.custoPastaTermica ?? 10}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        custoPastaTermica: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                  />
                  <span className="text-[11px] text-slate-400">Aplicação em CPU/GPU (tubos fracionados de alto rendimento)</span>
                </div>

                {/* Insumos de Limpeza */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Custo Padrão Insumos de Bancada (R$):
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.custoInsumosBancada ?? 6}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        custoInsumosBancada: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                  />
                  <span className="text-[11px] text-slate-400">Álcool isopropílico, limpadores, pincéis e thermal pads</span>
                </div>

                {/* Markup Peças */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Markup Comercial Padrão em Peças (%):
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData.markupPadraoPecas ?? 20}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        markupPadraoPecas: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                  />
                  <span className="text-[11px] text-slate-400">Margem padrão aplicada sobre custo de SSD, RAM, fontes, etc.</span>
                </div>

                {/* Taxa de Risco (%) */}
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Taxa de Responsabilidade Técnica (%):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.percentualTaxaRiscoHardware ?? 3}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        percentualTaxaRiscoHardware: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                  />
                  <span className="text-[11px] text-slate-400">Percentual de seguro de bancada sobre máquinas de alto valor</span>
                </div>

                {/* Limite de Alto Valor */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Limite para Taxa de Responsabilidade (R$):
                  </label>
                  <input
                    type="number"
                    step="500"
                    min="0"
                    value={formData.limiteAltoValorHardware ?? 5000}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        limiteAltoValorHardware: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                  />
                  <span className="text-[11px] text-slate-400">Equipamentos avaliados acima deste valor acionam automaticamente a taxa de risco</span>
                </div>

                {/* Juros Escalonados de Parcelamento no Cartão */}
                <div className="sm:col-span-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-xs uppercase tracking-wider">
                    Condições de Pagamento no Cartão (Juros Escalonados)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Taxa Cartão - 2x a 6x (%):
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.taxaJurosCartao2a6 ?? 5.5}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            taxaJurosCartao2a6: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Taxa intermediária repassada ao cliente (Padrão: 5.5%)</span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Taxa Cartão - 7x a 12x (%):
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.taxaJurosCartao7a12 ?? 10.5}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            taxaJurosCartao7a12: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-xs"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">Taxa estendida repassada ao cliente (Padrão: 10.5%)</span>
                    </div>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                    * 1x no cartão de crédito é sempre considerado à vista sem juros (0%).
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: ESCALA & ARREDONDAMENTO */}
          {abaAtiva === 'descontos' && (
            <div className="space-y-4 text-xs">
              {/* Desconto à Vista */}
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                <label className="block font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                  Desconto Especial À Vista (Pix / Dinheiro / Binance Pay) (%):
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="30"
                  value={formData.descontoAVistaPix}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      descontoAVistaPix: parseFloat(e.target.value) || 8,
                    })
                  }
                  className="w-32 px-3 py-1.5 rounded-lg border border-emerald-300 bg-white dark:bg-slate-800 font-bold text-sm"
                />
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 block">
                  Destaque automático gerado na proposta comercial e no WhatsApp.
                </span>
              </div>

              {/* Arredondamento Inteligente */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">
                    Arredondamento Inteligente por Magnitude Comercial
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    &lt;R$10 (0,50) • R$10-50 (inteiro/.90) • R$50-200 (5,00) • &gt;R$200 (10,00)
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.arredondamentoAtivo}
                    onChange={(e) =>
                      setFormData({ ...formData, arredondamentoAtivo: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-sky-600"></div>
                </label>
              </div>

              {/* Tabela de Regras de Lote */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200">
                    Regras de Desconto Progressivo por Lote (Escala)
                  </h4>
                  <button
                    type="button"
                    onClick={adicionarRegraLote}
                    className="flex items-center space-x-1 text-sky-600 dark:text-sky-400 font-bold hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Faixa</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {formData.regrasDescontoLote.map((regra, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700"
                    >
                      <span className="text-slate-400">De:</span>
                      <input
                        type="number"
                        min="1"
                        value={regra.minUnidades}
                        onChange={(e) =>
                          atualizarRegraLote(idx, 'minUnidades', parseInt(e.target.value) || 1)
                        }
                        className="w-16 px-2 py-1 rounded border bg-white dark:bg-slate-800 font-bold"
                      />
                      <span className="text-slate-400">até:</span>
                      <input
                        type="number"
                        placeholder="Infinito"
                        value={regra.maxUnidades || ''}
                        onChange={(e) =>
                          atualizarRegraLote(idx, 'maxUnidades', parseInt(e.target.value) || 0)
                        }
                        className="w-16 px-2 py-1 rounded border bg-white dark:bg-slate-800 font-bold"
                      />
                      <span className="text-slate-400">Desconto:</span>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={regra.percentualDesconto}
                        onChange={(e) =>
                          atualizarRegraLote(
                            idx,
                            'percentualDesconto',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-16 px-2 py-1 rounded border bg-white dark:bg-slate-800 font-bold text-emerald-600"
                      />
                      <span className="text-slate-400">%</span>
                      <button
                        type="button"
                        onClick={() => removerRegraLote(idx)}
                        className="ml-auto text-slate-400 hover:text-rose-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ABA 3: EMPRESA & DADOS PARA O CLIENTE */}
          {abaAtiva === 'empresa' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Sua Oficina / Empresa 3D:
                </label>
                <input
                  type="text"
                  value={formData.nomeEmpresa}
                  onChange={(e) => setFormData({ ...formData, nomeEmpresa: e.target.value })}
                  placeholder="Ex: PrintForge Pro 3D Studios"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Telefone / WhatsApp Comercial:
                </label>
                <input
                  type="text"
                  value={formData.telefoneEmpresa}
                  onChange={(e) => setFormData({ ...formData, telefoneEmpresa: e.target.value })}
                  placeholder="Ex: (11) 98765-4321"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Chave Pix para Pagamento:
                </label>
                <input
                  type="text"
                  value={formData.chavePix}
                  onChange={(e) => setFormData({ ...formData, chavePix: e.target.value })}
                  placeholder="Ex: financeiro@printforge3d.com.br ou CNPJ"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Identificador / Carteira Binance Pay (Opcional):
                </label>
                <input
                  type="text"
                  value={formData.carteiraBinancePay || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, carteiraBinancePay: e.target.value })
                  }
                  placeholder="Ex: pay_printforge_8832"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
                />
              </div>
            </div>
          )}

          {/* ABA 4: GOOGLE DRIVE API */}
          {abaAtiva === 'nuvem' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 space-y-2">
                <div className="flex items-center space-x-2 text-sky-800 dark:text-sky-300 font-bold">
                  <Cloud className="w-4 h-4 text-sky-500" />
                  <span>Sincronização Segura via Google Drive (OAuth 2.0)</span>
                </div>
                <p className="text-slate-600 dark:text-slate-400">
                  O aplicativo utiliza o escopo restrito <code>drive.file</code>. Ele só tem acesso ao arquivo criado por ele mesmo (<code>precificacao_3d_data.json</code>), garantindo 100% de privacidade dos seus outros documentos do Google.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">
                    Google Client ID (OAuth 2.0 Web Client):
                  </label>
                  {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800">
                      Padrão do Sistema Ativo
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={formData.googleClientId || ''}
                  onChange={(e) => setFormData({ ...formData, googleClientId: e.target.value })}
                  placeholder={import.meta.env.VITE_GOOGLE_CLIENT_ID || "Ex: 1234567890-abcdefg.apps.googleusercontent.com"}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {import.meta.env.VITE_GOOGLE_CLIENT_ID
                    ? 'O sistema já possui um Client ID pré-configurado globalmente. Você só precisa preencher aqui se quiser usar outro código personalizado.'
                    : 'Crie gratuitamente no Google Cloud Console com Origem JavaScript autorizada. Dica: você também pode definir VITE_GOOGLE_CLIENT_ID no arquivo .env ou na Vercel.'}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-slate-500 block">Status da Conexão:</span>
                  <strong
                    className={
                      isDriveConnected
                        ? 'text-emerald-600 dark:text-emerald-400 text-sm'
                        : 'text-slate-600 dark:text-slate-400 text-sm'
                    }
                  >
                    {isDriveConnected ? 'Conectado e Autenticado' : 'Desconectado (Modo Local)'}
                  </strong>
                </div>

                <div>
                  {isDriveConnected ? (
                    <button
                      type="button"
                      onClick={onDesconectarDrive}
                      className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold"
                    >
                      Desconectar Google Drive
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onConectarDrive}
                      className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20"
                    >
                      Autenticar com Google Drive
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Rodapé com Salvar */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-md shadow-sky-600/20"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Configurações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
