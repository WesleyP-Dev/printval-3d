import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Zap,
  Clock,
  Weight,
  Layers,
  Sparkles,
  FileText,
  Share2,
  Save,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  CreditCard,
  QrCode,
  DollarSign,
  FolderPlus,
  ArrowRight,
  Wrench,
  Palette,
  RotateCcw,
  Calculator,
} from 'lucide-react';
import {
  Filamento,
  ConfiguracoesGlobais,
  ItemOrcamento,
  InsumoSecundario,
  Orcamento,
  ComplexidadePosProcesso,
  MaterialItemOrcamento,
  DetalheMaterialResultado,
} from '../types';
import { calcularOrcamento } from '../utils/pricingEngine';
import { formatarMoeda, gerarPropostaPDF } from '../utils/pdfGenerator';
import { gerarTextoWhatsApp, copiarTextoParaAreaDeTransferencia, abrirLinkWhatsApp } from '../utils/whatsappShare';

const DRAFT_KEY = 'printval_3d_draft_calculadora';

interface RascunhoCalculadora {
  materiais?: MaterialItemOrcamento[];
  tempoHoras?: number;
  tempoMinutos?: number;
  quantidadeLote?: number;
  complexidade?: ComplexidadePosProcesso;
  valorMaoDeObraManual?: number;
  tempoManualMinutos?: number;
  tipoInputManual?: 'reais' | 'minutos';
  taxaSetupOverride?: string;
  insumos?: InsumoSecundario[];
  descontoTipo?: 'percentual' | 'fixo';
  descontoValor?: number;
  prazoOverride?: string;
  clienteNome?: string;
  clienteTelefone?: string;
  clienteEmail?: string;
  projetoNome?: string;
  descricao?: string;
}

function carregarRascunhoCalculadora(): RascunhoCalculadora | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Subcomponente memoizado para cada linha de material (evita re-render de toda a lista ao alterar um input)
interface MaterialRowItemProps {
  mat: MaterialItemOrcamento;
  index: number;
  filamentos: Filamento[];
  detalhe?: DetalheMaterialResultado;
  totalMateriais: number;
  onAtualizar: (id: string, updates: Partial<MaterialItemOrcamento>) => void;
  onRemover: (id: string) => void;
}

const MaterialRowItem = React.memo<MaterialRowItemProps>(({
  mat,
  index,
  filamentos,
  detalhe,
  totalMateriais,
  onAtualizar,
  onRemover,
}) => {
  const fil = useMemo(
    () => filamentos.find((f) => f.id === mat.filamentoId) || filamentos[0],
    [filamentos, mat.filamentoId]
  );
  const saldoInsuficiente = detalhe?.saldoInsuficiente;

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all ${
        saldoInsuficiente
          ? 'border-rose-300 dark:border-rose-800/80 bg-rose-50/60 dark:bg-rose-950/30'
          : 'border-slate-200 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/50 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Preview da Cor & Rótulo da Parte */}
        <div className="sm:col-span-4 flex items-center space-x-2.5">
          <div
            className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-700 shadow-sm flex-shrink-0"
            style={{ backgroundColor: fil?.corHex || '#999' }}
            title={fil?.corNome}
          />
          <div className="flex-1 min-w-0">
            <input
              type="text"
              value={mat.rotuloParte || ''}
              onChange={(e) => onAtualizar(mat.id, { rotuloParte: e.target.value })}
              placeholder={`Parte ${index + 1} (ex: Corpo, Olhos)`}
              className="w-full text-xs font-bold text-slate-800 dark:text-slate-100 bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 focus:outline-none focus:border-sky-500 py-0.5"
            />
            <span className="text-[10px] text-slate-400 dark:text-slate-400 block truncate">
              {fil ? `${fil.tipo} • ${fil.corNome} (${fil.marca})` : 'Selecione'}
            </span>
          </div>
        </div>

        {/* Seletor do Filamento */}
        <div className="sm:col-span-4">
          <select
            value={mat.filamentoId}
            onChange={(e) => onAtualizar(mat.id, { filamentoId: e.target.value })}
            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-sky-500"
          >
            {filamentos.map((f) => (
              <option key={f.id} value={f.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                {f.favorito ? '⭐ ' : ''}
                {f.tipo} - {f.nome} • {f.corNome} ({f.pesoRestanteGramas}g)
              </option>
            ))}
          </select>
        </div>

        {/* Peso Total Consumido (g) */}
        <div className="sm:col-span-3 flex items-center space-x-1.5">
          <div className="relative flex-1">
            <input
              type="number"
              min="1"
              step="1"
              value={mat.pesoGramas}
              onChange={(e) =>
                onAtualizar(mat.id, { pesoGramas: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-2.5 py-1.5 pr-7 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500"
              placeholder="Gramas"
            />
            <span className="absolute right-2 top-1.5 text-[10px] font-bold text-slate-400">
              g
            </span>
          </div>

          {/* Custo parcial calculado para este item */}
          <span className="text-[11px] font-bold text-slate-700 dark:text-emerald-400 whitespace-nowrap">
            {formatarMoeda(detalhe?.custoTotal || 0)}
          </span>
        </div>

        {/* Botão de Remoção */}
        <div className="sm:col-span-1 text-right">
          {totalMateriais > 1 ? (
            <button
              type="button"
              onClick={() => onRemover(mat.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
              title="Remover este material"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">1/1</span>
          )}
        </div>
      </div>

      {/* Alerta de saldo insuficiente individual */}
      {saldoInsuficiente && (
        <div className="mt-2 text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center space-x-1">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>
            Estoque insuficiente! Necessário {mat.pesoGramas}g, mas restam apenas{' '}
            {fil?.pesoRestanteGramas}g no carretel.
          </span>
        </div>
      )}
    </div>
  );
});

interface CalculadoraTabProps {
  filamentos: Filamento[];
  config: ConfiguracoesGlobais;
  onSalvarOrcamento: (orcamento: Orcamento) => void;
  orcamentoParaClonar?: Orcamento | null;
}

export const CalculadoraTab: React.FC<CalculadoraTabProps> = ({
  filamentos,
  config,
  onSalvarOrcamento,
  orcamentoParaClonar,
}) => {
  // Lista dinâmica de Materiais / Cores (Multicolor e Multipieças)
  const [materiais, setMateriais] = useState<MaterialItemOrcamento[]>(() => {
    if (orcamentoParaClonar?.item?.materiais && orcamentoParaClonar.item.materiais.length > 0) {
      return orcamentoParaClonar.item.materiais;
    }
    const rascunho = carregarRascunhoCalculadora();
    if (rascunho?.materiais && rascunho.materiais.length > 0) {
      return rascunho.materiais;
    }
    const fav = filamentos.find((f) => f.favorito) || filamentos[0];
    const initialPeso = orcamentoParaClonar?.item?.pesoPecaGramas
      ? orcamentoParaClonar.item.pesoPecaGramas * (orcamentoParaClonar.item.quantidadeLote || 1)
      : 45;
    return [
      {
        id: `mat-${Date.now()}-1`,
        filamentoId: orcamentoParaClonar?.item?.filamentoId || fav?.id || '',
        pesoGramas: initialPeso,
        rotuloParte: 'Parte Principal',
      },
    ];
  });

  const adicionarMaterial = useCallback(() => {
    const fav = filamentos.find((f) => f.favorito) || filamentos[0];
    setMateriais((prev) => [
      ...prev,
      {
        id: `mat-${Date.now()}-${prev.length + 1}`,
        filamentoId: fav?.id || '',
        pesoGramas: 15,
        rotuloParte: `Cor / Parte ${prev.length + 1}`,
      },
    ]);
  }, [filamentos]);

  const removerMaterial = useCallback((id: string) => {
    setMateriais((prev) => (prev.length <= 1 ? prev : prev.filter((m) => m.id !== id)));
  }, []);

  const atualizarMaterial = useCallback((id: string, updates: Partial<MaterialItemOrcamento>) => {
    setMateriais((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
    );
  }, []);

  const [tempoHoras, setTempoHoras] = useState<number>(
    () => orcamentoParaClonar?.item?.tempoImpressaoHoras ?? carregarRascunhoCalculadora()?.tempoHoras ?? 3
  );
  const [tempoMinutos, setTempoMinutos] = useState<number>(
    () => orcamentoParaClonar?.item?.tempoImpressaoMinutos ?? carregarRascunhoCalculadora()?.tempoMinutos ?? 30
  );
  const [quantidadeLote, setQuantidadeLote] = useState<number>(
    () => orcamentoParaClonar?.item?.quantidadeLote ?? carregarRascunhoCalculadora()?.quantidadeLote ?? 1
  );

  // Mão de obra e Pós-Processamento (Taxa de Setup + Presets de Complexidade)
  const [complexidade, setComplexidade] = useState<ComplexidadePosProcesso>(
    () => orcamentoParaClonar?.item?.complexidadePosProcesso ?? carregarRascunhoCalculadora()?.complexidade ?? 'simples'
  );
  const [valorMaoDeObraManual, setValorMaoDeObraManual] = useState<number>(
    () => orcamentoParaClonar?.item?.valorMaoDeObraManual ?? carregarRascunhoCalculadora()?.valorMaoDeObraManual ?? 10.0
  );
  const [tempoManualMinutos, setTempoManualMinutos] = useState<number>(
    () => orcamentoParaClonar?.item?.tempoMaoDeObraManualMinutos ?? carregarRascunhoCalculadora()?.tempoManualMinutos ?? 15
  );
  const [tipoInputManual, setTipoInputManual] = useState<'reais' | 'minutos'>(
    () => carregarRascunhoCalculadora()?.tipoInputManual ?? 'reais'
  );
  const [taxaSetupOverride, setTaxaSetupOverride] = useState<string>(
    () => orcamentoParaClonar?.item?.taxaSetupManualOverride !== undefined
      ? String(orcamentoParaClonar.item.taxaSetupManualOverride)
      : (carregarRascunhoCalculadora()?.taxaSetupOverride ?? '')
  );

  // Insumos Secundários
  const [insumos, setInsumos] = useState<InsumoSecundario[]>(
    () => orcamentoParaClonar?.item?.insumosSecundarios ?? carregarRascunhoCalculadora()?.insumos ?? []
  );
  const [novoInsumoNome, setNovoInsumoNome] = useState('');
  const [novoInsumoCusto, setNovoInsumoCusto] = useState<number>(0);
  const [novoInsumoTipo, setNovoInsumoTipo] = useState<'unidade' | 'lote'>('unidade');

  // Desconto comercial avulso
  const [descontoTipo, setDescontoTipo] = useState<'percentual' | 'fixo'>(
    () => orcamentoParaClonar?.item?.descontoComercialTipo ?? carregarRascunhoCalculadora()?.descontoTipo ?? 'percentual'
  );
  const [descontoValor, setDescontoValor] = useState<number>(
    () => orcamentoParaClonar?.item?.descontoComercialValor ?? carregarRascunhoCalculadora()?.descontoValor ?? 0
  );

  // Prazo comercial
  const [prazoOverride, setPrazoOverride] = useState<string>(
    () => orcamentoParaClonar?.item?.prazoManualOverride ?? carregarRascunhoCalculadora()?.prazoOverride ?? ''
  );

  // Dados do Cliente e Projeto
  const [clienteNome, setClienteNome] = useState<string>(
    () => orcamentoParaClonar?.clienteNome ?? carregarRascunhoCalculadora()?.clienteNome ?? ''
  );
  const [clienteTelefone, setClienteTelefone] = useState<string>(
    () => orcamentoParaClonar?.clienteTelefone ?? carregarRascunhoCalculadora()?.clienteTelefone ?? ''
  );
  const [clienteEmail, setClienteEmail] = useState<string>(
    () => orcamentoParaClonar?.clienteEmail ?? carregarRascunhoCalculadora()?.clienteEmail ?? ''
  );
  const [projetoNome, setProjetoNome] = useState<string>(
    () => orcamentoParaClonar?.projetoNome ?? carregarRascunhoCalculadora()?.projetoNome ?? 'Peça Técnica 3D'
  );
  const [descricao, setDescricao] = useState<string>(
    () => orcamentoParaClonar?.descricao ?? carregarRascunhoCalculadora()?.descricao ?? ''
  );

  // Feedback de ações
  const [copiadoWhatsapp, setCopiadoWhatsapp] = useState(false);
  const [salvoSucesso, setSalvoSucesso] = useState(false);

  // Efeito para clonar orçamento quando fornecido pelas props
  useEffect(() => {
    if (orcamentoParaClonar && orcamentoParaClonar.item) {
      if (orcamentoParaClonar.item.materiais && orcamentoParaClonar.item.materiais.length > 0) {
        setMateriais(orcamentoParaClonar.item.materiais);
      } else {
        setMateriais([
          {
            id: `mat-${Date.now()}-1`,
            filamentoId: orcamentoParaClonar.item.filamentoId || filamentos[0]?.id || '',
            pesoGramas: (orcamentoParaClonar.item.pesoPecaGramas || 45) * (orcamentoParaClonar.item.quantidadeLote || 1),
            rotuloParte: 'Parte Principal',
          },
        ]);
      }
      setTempoHoras(orcamentoParaClonar.item.tempoImpressaoHoras);
      setTempoMinutos(orcamentoParaClonar.item.tempoImpressaoMinutos);
      setQuantidadeLote(orcamentoParaClonar.item.quantidadeLote);
      setComplexidade(orcamentoParaClonar.item.complexidadePosProcesso);
      setValorMaoDeObraManual(orcamentoParaClonar.item.valorMaoDeObraManual ?? 10);
      setTempoManualMinutos(orcamentoParaClonar.item.tempoMaoDeObraManualMinutos ?? 15);
      setTaxaSetupOverride(
        orcamentoParaClonar.item.taxaSetupManualOverride !== undefined
          ? String(orcamentoParaClonar.item.taxaSetupManualOverride)
          : ''
      );
      setInsumos(orcamentoParaClonar.item.insumosSecundarios || []);
      setDescontoTipo(orcamentoParaClonar.item.descontoComercialTipo);
      setDescontoValor(orcamentoParaClonar.item.descontoComercialValor);
      setPrazoOverride(orcamentoParaClonar.item.prazoManualOverride || '');
      setClienteNome(orcamentoParaClonar.clienteNome);
      setClienteTelefone(orcamentoParaClonar.clienteTelefone || '');
      setClienteEmail(orcamentoParaClonar.clienteEmail || '');
      setProjetoNome(orcamentoParaClonar.projetoNome);
      setDescricao(orcamentoParaClonar.descricao || '');
    }
  }, [orcamentoParaClonar, filamentos]);

  // Efeito de auto-salvamento do rascunho em localStorage com debounce (evita I/O síncrono contínuo ao digitar)
  useEffect(() => {
    const timer = setTimeout(() => {
      const draft: RascunhoCalculadora = {
        materiais,
        tempoHoras,
        tempoMinutos,
        quantidadeLote,
        complexidade,
        valorMaoDeObraManual,
        tempoManualMinutos,
        tipoInputManual,
        taxaSetupOverride,
        insumos,
        descontoTipo,
        descontoValor,
        prazoOverride,
        clienteNome,
        clienteTelefone,
        clienteEmail,
        projetoNome,
        descricao,
      };
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch {
        // Ignora erro de quota
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [
    materiais,
    tempoHoras,
    tempoMinutos,
    quantidadeLote,
    complexidade,
    valorMaoDeObraManual,
    tempoManualMinutos,
    tipoInputManual,
    taxaSetupOverride,
    insumos,
    descontoTipo,
    descontoValor,
    prazoOverride,
    clienteNome,
    clienteTelefone,
    clienteEmail,
    projetoNome,
    descricao,
  ]);

  // Função para limpar todos os campos da calculadora memoizada
  const handleLimparCampos = useCallback(() => {
    const confirmou = confirm(
      'Deseja realmente limpar todos os campos da calculadora e iniciar um novo orçamento do zero?'
    );
    if (!confirmou) return;

    const fav = filamentos.find((f) => f.favorito) || filamentos[0];
    setMateriais([
      {
        id: `mat-${Date.now()}-1`,
        filamentoId: fav?.id || '',
        pesoGramas: 45,
        rotuloParte: 'Parte Principal',
      },
    ]);
    setTempoHoras(3);
    setTempoMinutos(0);
    setQuantidadeLote(1);
    setComplexidade('simples');
    setValorMaoDeObraManual(10);
    setTempoManualMinutos(15);
    setTipoInputManual('reais');
    setTaxaSetupOverride('');
    setInsumos([]);
    setDescontoTipo('percentual');
    setDescontoValor(0);
    setPrazoOverride('');
    setClienteNome('');
    setClienteTelefone('');
    setClienteEmail('');
    setProjetoNome('Peça Técnica 3D');
    setDescricao('');

    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // Ignora
    }
  }, [filamentos]);

  // Filamento principal (primeiro material da lista ou fallback)
  const filamentoPrincipal = useMemo(() => {
    const primeiroId = materiais[0]?.filamentoId;
    return (
      filamentos.find((f) => f.id === primeiroId) ||
      filamentos[0] || {
        id: 'default',
        nome: 'Padrão',
        marca: 'Genérica',
        tipo: 'PLA' as const,
        corHex: '#000000',
        corNome: 'Preto',
        pesoTotalGramas: 1000,
        pesoRestanteGramas: 1000,
        precoAtual: 120,
        fatorQualidadeRisco: 1.0,
        favorito: false,
        historicoPreco: [],
      }
    );
  }, [filamentos, materiais]);

  const materiaisSnapshots = useMemo(() => {
    return materiais
      .map((m) => filamentos.find((f) => f.id === m.filamentoId))
      .filter((f): f is Filamento => Boolean(f));
  }, [filamentos, materiais]);

  // Montagem do item de orçamento
  const itemAtual: ItemOrcamento = useMemo(() => {
    const pesoTotal = materiais.reduce((acc, m) => acc + (Number(m.pesoGramas) || 0), 0);
    const qtd = Math.max(1, Number(quantidadeLote) || 1);
    return {
      materiais,
      filamentoId: materiais[0]?.filamentoId || '',
      pesoPecaGramas: qtd > 0 ? Number((pesoTotal / qtd).toFixed(2)) : 0,
      tempoImpressaoHoras: Math.max(0, Number(tempoHoras) || 0),
      tempoImpressaoMinutos: Math.max(0, Number(tempoMinutos) || 0),
      quantidadeLote: qtd,
      complexidadePosProcesso: complexidade,
      valorMaoDeObraManual:
        complexidade === 'manual' && tipoInputManual === 'reais'
          ? Math.max(0, Number(valorMaoDeObraManual) || 0)
          : undefined,
      tempoMaoDeObraManualMinutos:
        complexidade === 'manual' && tipoInputManual === 'minutos'
          ? Math.max(0, Number(tempoManualMinutos) || 0)
          : undefined,
      taxaSetupManualOverride:
        taxaSetupOverride.trim() !== '' ? Math.max(0, Number(taxaSetupOverride)) : undefined,
      insumosSecundarios: insumos,
      descontoComercialTipo: descontoTipo,
      descontoComercialValor: Math.max(0, Number(descontoValor) || 0),
      prazoManualOverride: prazoOverride,
    };
  }, [
    materiais,
    tempoHoras,
    tempoMinutos,
    quantidadeLote,
    complexidade,
    valorMaoDeObraManual,
    tempoManualMinutos,
    tipoInputManual,
    taxaSetupOverride,
    insumos,
    descontoTipo,
    descontoValor,
    prazoOverride,
  ]);

  // Cálculo matemático reativo
  const resultado = useMemo(() => {
    return calcularOrcamento(itemAtual, filamentos, config);
  }, [itemAtual, filamentos, config]);

  // Gerenciamento de insumos secundários memoizado
  const adicionarInsumo = useCallback(() => {
    if (!novoInsumoNome.trim()) return;
    const novo: InsumoSecundario = {
      id: `ins-${Date.now()}`,
      nome: novoInsumoNome.trim(),
      custoUnitario: Number(novoInsumoCusto) || 0,
      aplicarPor: novoInsumoTipo,
      quantidade: 1,
    };
    setInsumos((prev) => [...prev, novo]);
    setNovoInsumoNome('');
    setNovoInsumoCusto(0);
  }, [novoInsumoNome, novoInsumoCusto, novoInsumoTipo]);

  const removerInsumo = useCallback((id: string) => {
    setInsumos((prev) => prev.filter((i) => i.id !== id));
  }, []);

  // Construir objeto de orçamento consolidado memoizado
  const construirOrcamentoAtual = useCallback((): Orcamento => {
    const agora = new Date();
    const ano = agora.getFullYear();
    const idUnico = `orc-${Date.now()}`;
    const numero = `ORC-${ano}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      id: idUnico,
      numero,
      dataCriacao: agora.toISOString(),
      clienteNome: clienteNome.trim() || 'Cliente Não Informado',
      clienteTelefone: clienteTelefone.trim(),
      clienteEmail: clienteEmail.trim(),
      projetoNome: projetoNome.trim() || 'Projeto Sem Título',
      descricao: descricao.trim(),
      item: itemAtual,
      filamentoSnapshot: filamentoPrincipal,
      materiaisSnapshots,
      resultado,
      status: 'Pendente',
      descontouEstoque: false,
    };
  }, [
    clienteNome,
    clienteTelefone,
    clienteEmail,
    projetoNome,
    descricao,
    itemAtual,
    filamentoPrincipal,
    materiaisSnapshots,
    resultado,
  ]);

  // Ações memoizadas
  const handleGerarPDF = useCallback(async () => {
    const orc = construirOrcamentoAtual();
    await gerarPropostaPDF(orc, config);
  }, [construirOrcamentoAtual, config]);

  const handleCopiarWhatsApp = useCallback(async () => {
    const orc = construirOrcamentoAtual();
    const texto = gerarTextoWhatsApp(orc, config);
    const ok = await copiarTextoParaAreaDeTransferencia(texto);
    if (ok) {
      setCopiadoWhatsapp(true);
      setTimeout(() => setCopiadoWhatsapp(false), 2500);
    }
  }, [construirOrcamentoAtual, config]);

  const handleAbrirWhatsApp = useCallback(() => {
    const orc = construirOrcamentoAtual();
    const texto = gerarTextoWhatsApp(orc, config);
    abrirLinkWhatsApp(clienteTelefone, texto);
  }, [construirOrcamentoAtual, config, clienteTelefone]);

  const handleSalvar = useCallback(() => {
    const orc = construirOrcamentoAtual();
    onSalvarOrcamento(orc);
    setSalvoSucesso(true);
    setTimeout(() => setSalvoSucesso(false), 3000);
  }, [construirOrcamentoAtual, onSalvarOrcamento]);

  return (
    <div className="space-y-6">
      {/* Barra Superior da Calculadora: Identificação e Botão de Limpar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Calculadora de Precificação 3D
              </h2>
              <span className="inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Rascunho Preservado</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Alterne entre as abas livremente — seus dados preenchidos permanecem salvos.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleLimparCampos}
            className="inline-flex items-center space-x-1.5 px-3 py-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800/80 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold transition-all border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800 cursor-pointer shadow-xs"
            title="Limpar todos os campos e iniciar um novo cálculo em branco"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpar Dados / Novo Orçamento</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Coluna Principal: Formulário de Fatiamento e Parâmetros (7 Colunas) */}
      <div className="lg:col-span-7 space-y-6">
        {/* Bloco 1: Seleção Dinâmica de Cores & Materiais */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
                <Palette className="w-4 h-4 text-sky-500" />
                <span>1. Materiais & Cores da Impressão</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Suporte a impressão monocromática, multicolorida ou multipieças de encaixe
              </p>
            </div>

            <button
              type="button"
              onClick={adicionarMaterial}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/50 dark:hover:bg-sky-900/50 text-sky-600 dark:text-sky-300 rounded-xl text-xs font-bold transition-all border border-sky-200 dark:border-sky-800 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Cor / Parte</span>
            </button>
          </div>

          {/* Lista Dinâmica de Materiais */}
          <div className="space-y-3">
            {materiais.map((mat, index) => (
              <MaterialRowItem
                key={mat.id}
                mat={mat}
                index={index}
                filamentos={filamentos}
                detalhe={resultado.detalhamentoMateriais[index]}
                totalMateriais={materiais.length}
                onAtualizar={atualizarMaterial}
                onRemover={removerMaterial}
              />
            ))}
          </div>

          {/* Card de Resumo Consolidado de Matéria-Prima */}
          <div className="p-3.5 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Consumo Consolidado:
                </span>
                <div className="flex -space-x-1 overflow-hidden">
                  {resultado.detalhamentoMateriais.map((d, i) => (
                    <div
                      key={i}
                      className="w-4 h-4 rounded-full border border-white dark:border-slate-800 shadow-xs"
                      style={{ backgroundColor: d.corHex }}
                      title={`${d.rotuloParte || d.corNome}: ${d.pesoTotalGramas}g`}
                    />
                  ))}
                </div>
              </div>

              <div className="text-right flex items-baseline justify-between sm:justify-end space-x-4">
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Peso Total: <strong className="text-slate-800 dark:text-slate-200">{resultado.pesoTotalLoteGramas}g</strong>
                  {itemAtual.quantidadeLote > 1 && (
                    <span className="text-[10px] text-slate-400 block sm:inline sm:ml-1">
                      ({(resultado.pesoTotalLoteGramas / itemAtual.quantidadeLote).toFixed(1)}g/un)
                    </span>
                  )}
                </span>
                <span className="text-xs font-extrabold text-sky-600 dark:text-sky-400">
                  Total Filamento: {formatarMoeda(resultado.custoMateriaPrimaTotal)}
                </span>
              </div>
            </div>

            {/* Chips das Cores */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {resultado.detalhamentoMateriais.map((d, i) => (
                <span
                  key={i}
                  className="inline-flex items-center space-x-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block"
                    style={{ backgroundColor: d.corHex }}
                  />
                  <span>
                    {d.rotuloParte || d.corNome}: {d.pesoTotalGramas}g ({formatarMoeda(d.custoTotal)})
                  </span>
                </span>
              ))}
            </div>
          </div>

          {/* Alerta Geral se Algum Filamento não tiver saldo */}
          {resultado.alertaSaldoInsuficienteGeral && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl flex items-center space-x-2.5 text-rose-700 dark:text-rose-300 text-xs font-medium animate-pulse">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                <strong>Atenção ao Estoque:</strong> Um ou mais carretéis selecionados não possuem saldo suficiente para este projeto.
              </span>
            </div>
          )}
        </div>

        {/* Bloco 2: Parâmetros de Fatiamento (Tempo e Lote) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>2. Parâmetros de Produção & Fatiamento</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Consumo Consolidado Total */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                <Weight className="w-3.5 h-3.5 text-slate-400" />
                <span>Consumo Total</span>
              </label>
              <div className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/60 flex items-baseline justify-between">
                <span className="font-extrabold text-base text-slate-900 dark:text-white">
                  {resultado.pesoTotalLoteGramas}g
                </span>
                {itemAtual.quantidadeLote > 1 && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {(resultado.pesoTotalLoteGramas / itemAtual.quantidadeLote).toFixed(1)}g / un
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400">Soma de todas as cores</span>
            </div>

            {/* Tempo de impressão */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Tempo / Peça *</span>
              </label>
              <div className="flex space-x-1.5">
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="Horas"
                    value={tempoHoras}
                    onChange={(e) => setTempoHoras(parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-sky-500"
                  />
                  <span className="absolute right-2 top-2.5 text-[10px] text-slate-400">h</span>
                </div>
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="Min"
                    value={tempoMinutos}
                    onChange={(e) => setTempoMinutos(parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:ring-2 focus:ring-sky-500"
                  />
                  <span className="absolute right-2 top-2.5 text-[10px] text-slate-400">min</span>
                </div>
              </div>
              <span className="text-[11px] text-slate-400">Tempo de máquina por peça</span>
            </div>

            {/* Quantidade Lote */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-slate-400" />
                <span>Quantidade (Lote) *</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantidadeLote}
                onChange={(e) => setQuantidadeLote(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-base focus:ring-2 focus:ring-sky-500"
              />
              {resultado.descontoLotePercentual > 0 && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Escala: {resultado.descontoLotePercentual}% off no lote
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Bloco 3: Mão de Obra e Pós-Processamento */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-indigo-500" />
              <span>3. Mão de Obra & Pós-Processamento</span>
            </h3>
            {/* Badge e Ajuste da Taxa de Setup */}
            <div className="flex items-center space-x-1.5 text-xs bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 px-2.5 py-1 rounded-lg">
              <span>Taxa de Setup: R$</span>
              <input
                type="number"
                min="0"
                step="1"
                placeholder={String(config.taxaSetupFixo ?? 8)}
                value={taxaSetupOverride}
                onChange={(e) => setTaxaSetupOverride(e.target.value)}
                className="w-14 px-1 py-0.5 rounded border border-indigo-300 dark:border-indigo-700/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold text-xs text-center focus:ring-1 focus:ring-indigo-500"
                title="Ajuste manual da Taxa de Setup para este orçamento (deixe em branco para usar o padrão)"
              />
            </div>
          </div>

          {/* Presets de Complexidade */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Selecione o Nível de Complexidade / Acabamento:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Nenhum */}
              <button
                type="button"
                onClick={() => setComplexidade('nenhum')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  complexidade === 'nenhum'
                    ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/60 ring-2 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${complexidade === 'nenhum' ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                    Nenhum
                  </span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatarMoeda(config.presetsComplexidade?.nenhum ?? 0)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Direto da mesa, sem suportes.
                </p>
              </button>

              {/* Simples */}
              <button
                type="button"
                onClick={() => setComplexidade('simples')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  complexidade === 'simples'
                    ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/60 ring-2 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${complexidade === 'simples' ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                    Simples
                  </span>
                  <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
                    +{formatarMoeda(config.presetsComplexidade?.simples ?? 6)}/un
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Pouco suporte / remoção rápida de brim.
                </p>
              </button>

              {/* Médio */}
              <button
                type="button"
                onClick={() => setComplexidade('medio')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  complexidade === 'medio'
                    ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/60 ring-2 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${complexidade === 'medio' ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                    Médio
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    +{formatarMoeda(config.presetsComplexidade?.medio ?? 14)}/un
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Suportes moderados, rebarbas, encaixes.
                </p>
              </button>

              {/* Complexo */}
              <button
                type="button"
                onClick={() => setComplexidade('complexo')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  complexidade === 'complexo'
                    ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/60 ring-2 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${complexidade === 'complexo' ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                    Complexo
                  </span>
                  <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                    +{formatarMoeda(config.presetsComplexidade?.complexo ?? 28)}/un
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Miniaturas, suportes delicados, lixamento manual.
                </p>
              </button>
            </div>

            {/* Opção Manual / Personalizado */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setComplexidade('manual')}
                className={`w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                  complexidade === 'manual'
                    ? 'border-sky-500 bg-sky-50/80 dark:bg-sky-950/60 ring-2 ring-sky-500/20'
                    : 'border-slate-200 dark:border-slate-700/60 bg-slate-50/80 dark:bg-slate-800/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div>
                  <span className={`text-xs font-bold ${complexidade === 'manual' ? 'text-slate-900 dark:text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                    Manual / Personalizado
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Definir valor direto em R$ ou horas/minutos dedicados.
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {complexidade === 'manual' ? 'Ativo' : 'Selecionar'}
                </span>
              </button>

              {complexidade === 'manual' && (
                <div className="mt-2.5 p-3.5 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                  <div className="flex items-center space-x-4 text-xs font-semibold text-slate-700 dark:text-slate-200">
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={tipoInputManual === 'reais'}
                        onChange={() => setTipoInputManual('reais')}
                        className="text-sky-600"
                      />
                      <span>Valor Fixo por Peça (R$)</span>
                    </label>
                    <label className="flex items-center space-x-1.5 cursor-pointer">
                      <input
                        type="radio"
                        checked={tipoInputManual === 'minutos'}
                        onChange={() => setTipoInputManual('minutos')}
                        className="text-sky-600"
                      />
                      <span>Tempo do Operador (Minutos)</span>
                    </label>
                  </div>

                  {tipoInputManual === 'reais' ? (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Custo de Acabamento por Peça (R$):
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={valorMaoDeObraManual}
                        onChange={(e) => setValorMaoDeObraManual(parseFloat(e.target.value) || 0)}
                        className="w-full sm:w-48 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs focus:ring-1 focus:ring-sky-500"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                          Minutos de Operador por Peça:
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="5"
                          value={tempoManualMinutos}
                          onChange={(e) => setTempoManualMinutos(parseInt(e.target.value) || 0)}
                          className="w-full sm:w-32 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold text-xs focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 pt-2">
                        Calculado a {formatarMoeda(config.taxaHorariaOperador)}/h
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Resumo do Cálculo de Mão de Obra */}
          <div className="p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200">
                Resumo do Acabamento:
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Setup ({formatarMoeda(resultado.taxaSetupTotal)}) + Acabamento ({formatarMoeda(resultado.custoComplexidadeUnitario)}/un × {itemAtual.quantidadeLote} un)
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Total Mão de Obra</span>
              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                {formatarMoeda(resultado.custoMaoDeObraTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Bloco 4: Insumos Secundários e Embalagens */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
              <FolderPlus className="w-4 h-4 text-emerald-500" />
              <span>4. Embalagens & Insumos Secundários</span>
            </h3>
            <span className="text-xs text-slate-500">
              Total Insumos: <strong>{formatarMoeda(resultado.custoInsumosTotal)}</strong>
            </span>
          </div>

          {/* Adicionar Insumo */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-50/80 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
            <div className="sm:col-span-5">
              <input
                type="text"
                placeholder="Ex: Inserto M3, Caixa de Envio, LED..."
                value={novoInsumoNome}
                onChange={(e) => setNovoInsumoNome(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="sm:col-span-3">
              <input
                type="number"
                step="0.50"
                min="0"
                placeholder="Custo (R$)"
                value={novoInsumoCusto || ''}
                onChange={(e) => setNovoInsumoCusto(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500"
              />
            </div>
            <div className="sm:col-span-2">
              <select
                value={novoInsumoTipo}
                onChange={(e) => setNovoInsumoTipo(e.target.value as 'unidade' | 'lote')}
                className="w-full px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white focus:ring-1 focus:ring-sky-500"
              >
                <option value="unidade" className="bg-white dark:bg-slate-900">Por Unidade</option>
                <option value="lote" className="bg-white dark:bg-slate-900">Por Lote</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <button
                type="button"
                onClick={adicionarInsumo}
                className="w-full flex items-center justify-center space-x-1 py-1.5 px-3 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Lista de Insumos */}
          {insumos.length > 0 && (
            <div className="space-y-1.5">
              {insumos.map((ins) => (
                <div
                  key={ins.id}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{ins.nome}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {ins.aplicarPor === 'unidade' ? 'Por Peça' : 'Por Lote'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatarMoeda(ins.custoUnitario)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removerInsumo(ins.id)}
                      className="text-slate-400 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bloco 5: Dados Comerciais do Cliente e Descontos Avulsos */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-teal-500" />
            <span>5. Dados do Cliente & Ajuste Comercial</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome do Cliente:
              </label>
              <input
                type="text"
                placeholder="Ex: João da Silva"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp / Telefone:
              </label>
              <input
                type="text"
                placeholder="Ex: (11) 98765-4321"
                value={clienteTelefone}
                onChange={(e) => setClienteTelefone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                E-mail:
              </label>
              <input
                type="email"
                placeholder="cliente@email.com"
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Projeto / Peça:
              </label>
              <input
                type="text"
                placeholder="Ex: Suporte de Painel"
                value={projetoNome}
                onChange={(e) => setProjetoNome(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Observações / Descrição Técnica do Projeto:
            </label>
            <input
              type="text"
              placeholder="Ex: Altura de camada 0.2mm, 3 paredes, 20% infill giroscópio"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Desconto Comercial Avulso */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Desconto Comercial Avulso:
              </label>
              <div className="flex space-x-2">
                <select
                  value={descontoTipo}
                  onChange={(e) => setDescontoTipo(e.target.value as 'percentual' | 'fixo')}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="percentual">% Porcento</option>
                  <option value="fixo">R$ Fixo</option>
                </select>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={descontoValor || ''}
                  onChange={(e) => setDescontoValor(parseFloat(e.target.value) || 0)}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                />
              </div>
            </div>

            {/* Ajuste Manual de Prazo */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Prazo Comercial (Sugerido: {resultado.prazoEstimadoSugerido}):
              </label>
              <input
                type="text"
                placeholder={resultado.prazoEstimadoSugerido}
                value={prazoOverride}
                onChange={(e) => setPrazoOverride(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Coluna Lateral: Resumo de Custos, Precificação & Ações (5 Colunas) */}
      <div className="lg:col-span-5 space-y-6">
        {/* Card Destaque: Preço de Venda Comercial */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl border border-slate-700/60 relative overflow-hidden">
          <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Precificação Inteligente</span>
            </span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
              {config.arredondamentoAtivo ? 'Arredondamento Ativo' : 'Valor Exato'}
            </span>
          </div>

          {/* Destaque À Vista (Pix / Binance / Dinheiro) */}
          <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-4 mb-4 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold mb-1">
              <span className="flex items-center space-x-1">
                <QrCode className="w-4 h-4 text-emerald-400" />
                <span>À VISTA (Pix / Binance Pay):</span>
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md text-[10px] font-bold">
                {resultado.descontoAVistaPercentual}% OFF
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-black text-emerald-400 tracking-tight">
                {formatarMoeda(resultado.precoFinalAVistaTotal)}
              </span>
              {itemAtual.quantidadeLote > 1 && (
                <span className="text-xs text-emerald-300 font-medium">
                  {formatarMoeda(resultado.precoFinalAVistaUnitario)} / un
                </span>
              )}
            </div>
          </div>

          {/* Preço Padrão (Cartão / Parcelado) */}
          <div className="flex items-baseline justify-between border-t border-slate-700/60 pt-3 mb-4">
            <div>
              <span className="text-xs text-slate-400 flex items-center space-x-1">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Preço Padrão (Cartão):</span>
              </span>
              <p className="text-xl font-bold text-slate-100">
                {formatarMoeda(resultado.precoFinalPadraoTotal)}
              </p>
            </div>
            {itemAtual.quantidadeLote > 1 && (
              <div className="text-right">
                <span className="text-xs text-slate-400">Unitário Padrão</span>
                <p className="text-sm font-semibold text-slate-300">
                  {formatarMoeda(resultado.precoFinalPadraoUnitario)} / un
                </p>
              </div>
            )}
          </div>

          {/* Prazo e Carga Horária */}
          <div className="bg-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs text-slate-300 mb-5">
            <div>
              <span className="text-slate-400">Prazo Calculado:</span>
              <p className="font-bold text-white mt-0.5">{resultado.prazoFinalAdotado}</p>
            </div>
            <div className="text-right">
              <span className="text-slate-400">Tempo de Máquina:</span>
              <p className="font-bold text-sky-400 mt-0.5">{resultado.cargaHorariaTotal} horas</p>
            </div>
          </div>

          {/* Botões de Ação Imediata */}
          <div className="space-y-2.5">
            <button
              onClick={handleSalvar}
              className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-bold text-sm bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-lg shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Orçamento no Histórico</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleGerarPDF}
                className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl font-semibold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-sky-400" />
                <span>Exportar PDF</span>
              </button>

              <button
                onClick={handleCopiarWhatsApp}
                className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>{copiadoWhatsapp ? 'Copiado!' : 'Copiar WhatsApp'}</span>
              </button>
            </div>

            {clienteTelefone && (
              <button
                onClick={handleAbrirWhatsApp}
                className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 border border-emerald-800/60 transition-colors"
              >
                <span>Enviar direto para {clienteTelefone}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}

            {salvoSucesso && (
              <div className="p-2 bg-emerald-500/20 border border-emerald-500/50 rounded-xl text-center text-xs font-semibold text-emerald-300 flex items-center justify-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Orçamento salvo com sucesso no Histórico!</span>
              </div>
            )}
          </div>
        </div>

        {/* Detalhamento Técnico & Transparência de Custos Diretos */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 pb-2 border-b border-slate-200 dark:border-slate-800 flex justify-between">
            <span>Composição Interna de Custos</span>
            <span className="text-slate-400">Total Direto</span>
          </h4>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>🧵 Matéria-Prima ({resultado.pesoTotalLoteGramas}g):</span>
              <strong className="text-slate-900 dark:text-white">
                {formatarMoeda(resultado.custoMateriaPrimaTotal)}
              </strong>
            </div>

            {resultado.detalhamentoMateriais.length > 1 && (
              <div className="pl-3 py-1 space-y-1 border-l-2 border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                {resultado.detalhamentoMateriais.map((mat, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="flex items-center space-x-1.5 truncate pr-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: mat.corHex }}
                      />
                      <span className="truncate">
                        {mat.rotuloParte || mat.corNome} ({mat.pesoTotalGramas}g)
                      </span>
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex-shrink-0">
                      {formatarMoeda(mat.custoTotal)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>⚡ Energia Elétrica ({resultado.consumoKwhTotal} kWh):</span>
              <strong className="text-slate-900 dark:text-white">
                {formatarMoeda(resultado.custoEnergiaTotal)}
              </strong>
            </div>

            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>⚙️ Depreciação & Manutenção ({resultado.tempoHorasTotal}h):</span>
              <strong className="text-slate-900 dark:text-white">
                {formatarMoeda(resultado.custoDepreciacaoTotal)}
              </strong>
            </div>

            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>👨‍🔧 Setup & Acabamento ({resultado.complexidadeRotulo}):</span>
              <strong className="text-slate-900 dark:text-white">
                {formatarMoeda(resultado.custoMaoDeObraTotal)}
              </strong>
            </div>

            {resultado.custoInsumosTotal > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>📦 Insumos Secundários / Embalagens:</span>
                <strong className="text-slate-900 dark:text-white">
                  {formatarMoeda(resultado.custoInsumosTotal)}
                </strong>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-bold text-slate-900 dark:text-white">
              <span>Custo Direto Total:</span>
              <span>{formatarMoeda(resultado.custoDiretoTotal)}</span>
            </div>

            <div className="flex justify-between text-sky-600 dark:text-sky-400 font-bold">
              <span>Margem Bruta Planejada ({resultado.margemBrutaPercentualEfetiva}%):</span>
              <span>+ {formatarMoeda(resultado.valorLucroTotal)}</span>
            </div>

            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
              <span>Margem de Contribuição Horária:</span>
              <span>{formatarMoeda(resultado.margemContribuicaoPorHora)} / hora</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};
