import React, { useState, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  DollarSign,
  Clock,
  Package,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Sliders,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts';
import { ConfiguracoesGlobais, Orcamento } from '../types';
import { calcularBreakEven } from '../utils/pricingEngine';
import { formatarMoeda } from '../utils/pdfGenerator';

interface BreakEvenTabProps {
  config: ConfiguracoesGlobais;
  orcamentos: Orcamento[];
  onSalvarConfig: (novaConfig: ConfiguracoesGlobais) => void;
}

export const BreakEvenTab: React.FC<BreakEvenTabProps> = ({
  config,
  orcamentos,
  onSalvarConfig,
}) => {
  // Ajuste rápido de parâmetros de custo fixo nesta aba
  const [custosFixos, setCustosFixos] = useState(config.custosFixosMensais);
  const [valorImpressora, setValorImpressora] = useState(config.valorAquisicaoImpressora);
  const [mesesAmortizacao, setMesesAmortizacao] = useState(config.mesesAmortizacao);
  const [salvo, setSalvo] = useState(false);

  const configAtualizada: ConfiguracoesGlobais = useMemo(() => ({
    ...config,
    custosFixosMensais: Number(custosFixos) || 0,
    valorAquisicaoImpressora: Number(valorImpressora) || 0,
    mesesAmortizacao: Math.max(1, Number(mesesAmortizacao) || 12),
  }), [config, custosFixos, valorImpressora, mesesAmortizacao]);

  const indicadores = useMemo(
    () => calcularBreakEven(configAtualizada, orcamentos),
    [configAtualizada, orcamentos]
  );

  const handleSalvarCustos = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSalvarConfig(configAtualizada);
    setSalvo(true);
    setTimeout(() => setSalvo(false), 2500);
  }, [configAtualizada, onSalvarConfig]);

  // Dados para o gráfico Recharts comparando Metas e Realizado
  const chartData = useMemo(() => [
    {
      nome: 'Custo Fixo Total',
      valor: indicadores.custoFixoMensalTotal,
      cor: '#ef4444', // Vermelho
    },
    {
      nome: 'Faturamento Mês',
      valor: indicadores.faturamentoMesAtual,
      cor: '#0ea5e9', // Azul
    },
    {
      nome: 'Margem Contribuição',
      valor: indicadores.faturamentoMesAtual > 0 ? indicadores.faturamentoMesAtual - (indicadores.custoFixoMensalTotal * 0.3) : 0,
      cor: '#10b981', // Verde
    },
  ], [indicadores.custoFixoMensalTotal, indicadores.faturamentoMesAtual]);

  return (
    <div className="space-y-6">
      {/* Topo do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-sky-500" />
            <span>Saúde Financeira & Ponto de Equilíbrio (Break-Even)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Descubra quantas horas de máquina e peças precisam ser vendidas no mês para cobrir os custos fixos da sua oficina.
          </p>
        </div>

        {/* Status Geral do Ponto de Equilíbrio */}
        <div>
          {indicadores.atingiuBreakEven ? (
            <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-bold shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>OPERAÇÃO NO LUCRO LÍQUIDO!</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-bold shadow-sm">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span>COBRINDO CUSTOS FIXOS</span>
            </div>
          )}
        </div>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Horas para Break-Even */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Ponto de Equilíbrio (Horas)</span>
            <Clock className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {indicadores.horasNecessariasBreakEven}h
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Horas de máquina/mês necessárias
          </span>
        </div>

        {/* Card 2: Horas Faturadas no Mês Atual */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Horas Faturadas (Mês)</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {indicadores.horasFaturadasMesAtual}h
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {indicadores.percentualAtingidoHoras}% da meta atingida
          </span>
        </div>

        {/* Card 3: Margem Contribuição Média */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Margem Contribuição / Hora</span>
            <DollarSign className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {formatarMoeda(indicadores.margemContribuicaoMediaPorHora)}
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Ganho livre por hora faturada
          </span>
        </div>

        {/* Card 4: Peças Médias para Equilíbrio */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
            <span>Peças Médias Estimadas</span>
            <Package className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            ~{indicadores.pecasNecessariasBreakEven} un
          </p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Baseado no histórico cadastrado
          </span>
        </div>
      </div>

      {/* Barra de Progresso do Mês Atual (Horas Faturadas vs Break-Even) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Progresso Operacional do Mês Atual
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparação direta entre horas vendidas (pedidos aprovados/entregues) e horas necessárias para o Break-Even.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-500">
              <strong>{indicadores.horasFaturadasMesAtual}h</strong> de{' '}
              <strong>{indicadores.horasNecessariasBreakEven}h</strong> necessárias
            </span>
          </div>
        </div>

        {/* Barra Visual de Progresso */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              indicadores.atingiuBreakEven ? 'bg-emerald-500' : 'bg-sky-500'
            }`}
            style={{ width: `${Math.min(100, indicadores.percentualAtingidoHoras)}%` }}
          />
        </div>

        {/* Legenda Informativa */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-slate-500">0h (Início do Mês)</span>
          <span className="font-bold text-sky-600 dark:text-sky-400">
            {indicadores.percentualAtingidoHoras}% Concluído
          </span>
          <span className="text-slate-500">
            {indicadores.atingiuBreakEven ? 'Zona de Lucro Líquido 🚀' : 'Meta de Break-Even 🎯'}
          </span>
        </div>
      </div>

      {/* Grid: Formulário de Custos Fixos & Gráfico Visual Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Painel de Custos Fixos (5 Colunas) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-sky-500" />
              <span>Parâmetros de Custo Fixo</span>
            </h3>
            <span className="text-xs font-bold text-rose-500">
              Total: {formatarMoeda(indicadores.custoFixoMensalTotal)}/mês
            </span>
          </div>

          <form onSubmit={handleSalvarCustos} className="space-y-4 text-xs">
            {/* Custos Operacionais Fixos */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Custos Fixos Mensais (R$):
              </label>
              <input
                type="number"
                step="20"
                min="0"
                value={custosFixos}
                onChange={(e) => setCustosFixos(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Aluguel/bancada, internet, licenças de software (CAD/Slicer), ferramentas e manutenção preventiva.
              </span>
            </div>

            {/* Valor de Compra da Impressora */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor de Aquisição da Impressora (R$):
              </label>
              <input
                type="number"
                step="100"
                min="0"
                value={valorImpressora}
                onChange={(e) => setValorImpressora(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm"
              />
            </div>

            {/* Meses para Amortização */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Período de Amortização (Meses):
              </label>
              <input
                type="number"
                step="1"
                min="1"
                max="60"
                value={mesesAmortizacao}
                onChange={(e) => setMesesAmortizacao(parseInt(e.target.value) || 12)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Amortização mensal da máquina:{' '}
                <strong>{formatarMoeda(indicadores.amortizacaoMensalImpressora)}/mês</strong>
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-md shadow-sky-600/20 transition-all cursor-pointer"
            >
              {salvo ? 'Custos Atualizados!' : 'Salvar Novos Parâmetros'}
            </button>
          </form>
        </div>

        {/* Gráfico Comparativo Recharts (7 Colunas) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              <span>Visão Financeira Comparativa (R$)</span>
            </h3>
            <span className="text-xs text-slate-500">Mês Atual</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="nome" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(v) => `R$${v}`} />
                <Tooltip
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [formatarMoeda(Number(value)), 'Valor']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    color: '#f8fafc',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.cor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 block">Faturamento Aprovado no Mês:</span>
              <strong className="text-base text-slate-900 dark:text-white">
                {formatarMoeda(indicadores.faturamentoMesAtual)}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60">
              <span className="text-slate-500 block">Lucro Líquido Acumulado:</span>
              <strong
                className={`text-base ${
                  indicadores.lucroLiquidoEstimadoMes >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatarMoeda(indicadores.lucroLiquidoEstimadoMes)}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
