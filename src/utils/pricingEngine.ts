import {
  Filamento,
  ConfiguracoesGlobais,
  ItemOrcamento,
  CalculoOrcamentoResultado,
  BreakEvenIndicadores,
  Orcamento,
  ComplexidadePosProcesso,
  DetalheMaterialResultado,
  MaterialItemOrcamento,
  HardwareItemOrcamento,
  OpcaoParcelamento,
} from '../types';

export function obterRotuloComplexidade(complexidade: ComplexidadePosProcesso): string {
  switch (complexidade) {
    case 'nenhum':
      return 'Nenhum (Direto da mesa, sem suportes)';
    case 'simples':
      return 'Simples (Pouco suporte / brim)';
    case 'medio':
      return 'Médio (Suportes moderados / rebarbas)';
    case 'complexo':
      return 'Complexo (Miniaturas / suportes delicados)';
    case 'manual':
      return 'Manual / Personalizado';
    default:
      return 'Padrão';
  }
}

/**
 * Função de Arredondamento Inteligente Comercial por Faixas de Magnitude
 */
export function aplicarArredondamentoInteligente(valor: number, ativo: boolean): number {
  if (!ativo || valor <= 0) return Number(valor.toFixed(2));

  if (valor < 10) {
    // Múltiplos de R$ 0,50
    return Math.round(valor * 2) / 2;
  } else if (valor >= 10 && valor <= 50) {
    // Formato comercial .90 ou inteiro mais próximo
    const floor = Math.floor(valor);
    const candidate90 = floor + 0.90;
    // Se a diferença para .90 for pequena (até 0.35) usamos .90, senão arredonda para inteiro
    if (Math.abs(valor - candidate90) < 0.45) {
      return Number(candidate90.toFixed(2));
    }
    return Math.round(valor);
  } else if (valor > 50 && valor <= 200) {
    // Múltiplos de R$ 5,00
    return Math.round(valor / 5) * 5;
  } else {
    // > R$ 200,00: Múltiplos de R$ 10,00
    return Math.round(valor / 10) * 10;
  }
}

/**
 * Cálculo do Prazo Comercial Estimado
 */
export function calcularPrazoComercial(cargaHorariaTotal: number, overrideManual?: string): {
  sugerido: string;
  final: string;
} {
  let sugerido = '';

  if (cargaHorariaTotal <= 6) {
    sugerido = '1 a 2 dias úteis';
  } else if (cargaHorariaTotal <= 15) {
    sugerido = '2 a 3 dias úteis';
  } else if (cargaHorariaTotal <= 30) {
    sugerido = '3 a 5 dias úteis';
  } else if (cargaHorariaTotal <= 60) {
    sugerido = '5 a 7 dias úteis';
  } else {
    const diasBase = Math.ceil(cargaHorariaTotal / 8);
    const diasComSegurancaMin = Math.ceil(diasBase * 1.3);
    const diasComSegurancaMax = Math.ceil(diasBase * 1.6);
    sugerido = `${diasComSegurancaMin} a ${diasComSegurancaMax} dias úteis`;
  }

  const final = overrideManual && overrideManual.trim().length > 0 ? overrideManual.trim() : sugerido;

  return { sugerido, final };
}

/**
 * Obter percentual de desconto por lote de acordo com as regras configuradas
 */
export function obterDescontoLote(quantidade: number, regras: ConfiguracoesGlobais['regrasDescontoLote']): number {
  if (!regras || regras.length === 0) return 0;
  for (const regra of regras) {
    const minOk = quantidade >= regra.minUnidades;
    const maxOk = regra.maxUnidades === undefined || quantidade <= regra.maxUnidades;
    if (minOk && maxOk) {
      return regra.percentualDesconto;
    }
  }
  return 0;
}

/**
 * Motor Central de Precificação para Impressão 3D
 */
export function calcularOrcamento(
  item: ItemOrcamento,
  filamentoOuLista: Filamento | Filamento[],
  config: ConfiguracoesGlobais
): CalculoOrcamentoResultado {
  const qtd = Math.max(1, item.quantidadeLote || 1);
  const filamentosCatalogo: Filamento[] = Array.isArray(filamentoOuLista)
    ? filamentoOuLista
    : [filamentoOuLista];

  // 1. Matéria-Prima Consolidada (Multicolorida e Multipieças)
  let pesoTotalLote = 0;
  let custoMateriaPrimaTotal = 0;
  const detalhamentoMateriais: DetalheMaterialResultado[] = [];
  let alertaSaldoInsuficienteGeral = false;

  const materiaisLista: MaterialItemOrcamento[] =
    item.materiais && item.materiais.length > 0
      ? item.materiais
      : [
          {
            id: 'legacy-1',
            filamentoId: item.filamentoId || filamentosCatalogo[0]?.id || '',
            pesoGramas: (item.pesoPecaGramas || 0) * qtd,
          },
        ];

  for (const mat of materiaisLista) {
    const fil =
      filamentosCatalogo.find((f) => f.id === mat.filamentoId) ||
      filamentosCatalogo[0] || {
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
      };

    const pesoTotalMaterial = Math.max(0, mat.pesoGramas || 0);
    const pesoUnitarioMaterial = qtd > 0 ? pesoTotalMaterial / qtd : 0;
    const precoPorGrama =
      (fil.precoAtual / (fil.pesoTotalGramas || 1000)) * (fil.fatorQualidadeRisco || 1.0);
    const custoItem = pesoTotalMaterial * precoPorGrama;
    const custoItemUnitario = qtd > 0 ? custoItem / qtd : 0;
    const saldoInsuficiente = pesoTotalMaterial > (fil.pesoRestanteGramas || 0);

    if (saldoInsuficiente) {
      alertaSaldoInsuficienteGeral = true;
    }

    pesoTotalLote += pesoTotalMaterial;
    custoMateriaPrimaTotal += custoItem;

    detalhamentoMateriais.push({
      filamentoId: fil.id,
      filamentoNome: fil.nome,
      marca: fil.marca,
      tipo: fil.tipo,
      corHex: fil.corHex,
      corNome: fil.corNome,
      pesoTotalGramas: Number(pesoTotalMaterial.toFixed(2)),
      pesoUnitarioGramas: Number(pesoUnitarioMaterial.toFixed(2)),
      custoPorGrama: Number(precoPorGrama.toFixed(4)),
      fatorQualidadeRisco: fil.fatorQualidadeRisco,
      custoTotal: Number(custoItem.toFixed(2)),
      custoUnitario: Number(custoItemUnitario.toFixed(2)),
      saldoDisponivel: fil.pesoRestanteGramas,
      saldoInsuficiente,
      rotuloParte: mat.rotuloParte,
    });
  }

  const custoMateriaPrimaUnitario = qtd > 0 ? custoMateriaPrimaTotal / qtd : 0;

  // 2. Tempo de Impressão e Energia
  const tempoUnitarioHoras = (item.tempoImpressaoHoras || 0) + (item.tempoImpressaoMinutos || 0) / 60;
  const tempoHorasTotal = tempoUnitarioHoras * qtd;

  const potenciaKw = (config.potenciaImpressoraW || 250) / 1000;
  const consumoKwhTotal = tempoHorasTotal * potenciaKw;
  const custoEnergiaTotal = consumoKwhTotal * (config.custoKwh || 0.90);
  const custoEnergiaUnitario = qtd > 0 ? custoEnergiaTotal / qtd : 0;

  // 3. Depreciação e Manutenção de Máquina
  const custoDepreciacaoTotal = tempoHorasTotal * (config.taxaDepreciacaoManutencaoHora || 3.0);
  const custoDepreciacaoUnitario = qtd > 0 ? custoDepreciacaoTotal / qtd : 0;

  // 4. Mão de Obra e Pós-Processamento (Taxa de Setup + Presets de Complexidade)
  const taxaSetupTotal = item.taxaSetupManualOverride !== undefined
    ? item.taxaSetupManualOverride
    : (config.taxaSetupFixo !== undefined ? config.taxaSetupFixo : 8.00);

  const presets = config.presetsComplexidade || {
    nenhum: 0.0,
    simples: 6.0,
    medio: 14.0,
    complexo: 28.0,
  };

  let custoComplexidadeUnitario = 0;
  const complexidade = item.complexidadePosProcesso || 'medio';

  if (complexidade === 'nenhum') {
    custoComplexidadeUnitario = presets.nenhum ?? 0;
  } else if (complexidade === 'simples') {
    custoComplexidadeUnitario = presets.simples ?? 6.0;
  } else if (complexidade === 'medio') {
    custoComplexidadeUnitario = presets.medio ?? 14.0;
  } else if (complexidade === 'complexo') {
    custoComplexidadeUnitario = presets.complexo ?? 28.0;
  } else if (complexidade === 'manual') {
    if (item.valorMaoDeObraManual !== undefined) {
      custoComplexidadeUnitario = Math.max(0, item.valorMaoDeObraManual);
    } else if (item.tempoMaoDeObraManualMinutos !== undefined) {
      custoComplexidadeUnitario = ((item.tempoMaoDeObraManualMinutos || 0) / 60) * (config.taxaHorariaOperador || 35.0);
    }
  }

  const custoComplexidadeTotal = custoComplexidadeUnitario * qtd;
  const custoMaoDeObraTotal = taxaSetupTotal + custoComplexidadeTotal;
  const custoMaoDeObraUnitario = qtd > 0 ? custoMaoDeObraTotal / qtd : 0;
  const tempoMaoDeObraMinutosTotal = Math.round((custoMaoDeObraTotal / (config.taxaHorariaOperador || 35.0)) * 60);

  // 5. Insumos Secundários
  let custoInsumosTotal = 0;
  if (item.insumosSecundarios && item.insumosSecundarios.length > 0) {
    for (const insumo of item.insumosSecundarios) {
      if (insumo.aplicarPor === 'unidade') {
        custoInsumosTotal += (insumo.custoUnitario || 0) * (insumo.quantidade || 1) * qtd;
      } else {
        custoInsumosTotal += (insumo.custoUnitario || 0) * (insumo.quantidade || 1);
      }
    }
  }
  const custoInsumosUnitario = qtd > 0 ? custoInsumosTotal / qtd : 0;

  // Custo Direto Total e Unitário
  const custoDiretoTotal =
    custoMateriaPrimaTotal +
    custoEnergiaTotal +
    custoDepreciacaoTotal +
    custoMaoDeObraTotal +
    custoInsumosTotal;
  const custoDiretoUnitario = custoDiretoTotal / qtd;

  // 6. Desconto de Escala / Lote e Margem de Lucro
  const margemBase = config.margemLucroBase || 45;
  const descontoLotePercentual = obterDescontoLote(qtd, config.regrasDescontoLote);

  // Redução proporcional sobre a margem de lucro
  const margemBrutaPercentualEfetiva = Math.max(5, margemBase * (1 - descontoLotePercentual / 100));
  const valorLucroTotal = custoDiretoTotal * (margemBrutaPercentualEfetiva / 100);

  // Preço subtotal
  const precoSubtotalTotal = custoDiretoTotal + valorLucroTotal;
  const precoSubtotalUnitario = precoSubtotalTotal / qtd;

  // 7. Desconto Comercial Avulso
  let valorDescontoComercialTotal = 0;
  if (item.descontoComercialValor > 0) {
    if (item.descontoComercialTipo === 'percentual') {
      valorDescontoComercialTotal = precoSubtotalTotal * (item.descontoComercialValor / 100);
    } else {
      valorDescontoComercialTotal = Math.min(precoSubtotalTotal, item.descontoComercialValor);
    }
  }

  const precoAposDescontoComercialTotal = Math.max(0, precoSubtotalTotal - valorDescontoComercialTotal);

  // 8. Arredondamento Inteligente
  let precoFinalPadraoTotal = precoAposDescontoComercialTotal;
  if (config.arredondamentoAtivo) {
    // Arredonda o preço total ou unitário comercialmente
    if (qtd === 1) {
      precoFinalPadraoTotal = aplicarArredondamentoInteligente(precoFinalPadraoTotal, true);
    } else {
      // Se for lote, arredondamos o unitário para valor comercial e multiplicamos
      const unitarioSemArred = precoAposDescontoComercialTotal / qtd;
      const unitarioArred = aplicarArredondamentoInteligente(unitarioSemArred, true);
      precoFinalPadraoTotal = unitarioArred * qtd;
    }
  }
  const precoFinalPadraoUnitario = qtd > 0 ? precoFinalPadraoTotal / qtd : 0;

  // 9. Preço à Vista (Pix, Dinheiro, Binance Pay)
  const descontoAVistaPercentual = config.descontoAVistaPix || 8;
  const valorDescontoAVista = precoFinalPadraoTotal * (descontoAVistaPercentual / 100);
  const precoFinalAVistaTotal = precoFinalPadraoTotal - valorDescontoAVista;
  const precoFinalAVistaUnitario = qtd > 0 ? precoFinalAVistaTotal / qtd : 0;

  // 10. Prazo Comercial
  const { sugerido, final } = calcularPrazoComercial(tempoHorasTotal, item.prazoManualOverride);

  // 11. Margem de Contribuição para Ponto de Equilíbrio
  // Preço de venda - Custos Variáveis diretos (Matéria-prima + Energia + Insumos + Mão de obra variável)
  const custosVariaveisDiretos = custoMateriaPrimaTotal + custoEnergiaTotal + custoInsumosTotal;
  const margemContribuicaoTotal = precoFinalPadraoTotal - custosVariaveisDiretos;
  const margemContribuicaoPorHora = tempoHorasTotal > 0 ? margemContribuicaoTotal / tempoHorasTotal : 0;

  return {
    detalhamentoMateriais,
    alertaSaldoInsuficienteGeral,
    pesoTotalLoteGramas: Number(pesoTotalLote.toFixed(2)),
    custoMateriaPrimaUnitario: Number(custoMateriaPrimaUnitario.toFixed(2)),
    custoMateriaPrimaTotal: Number(custoMateriaPrimaTotal.toFixed(2)),

    tempoHorasTotal: Number(tempoHorasTotal.toFixed(2)),
    consumoKwhTotal: Number(consumoKwhTotal.toFixed(2)),
    custoEnergiaUnitario: Number(custoEnergiaUnitario.toFixed(2)),
    custoEnergiaTotal: Number(custoEnergiaTotal.toFixed(2)),

    custoDepreciacaoUnitario: Number(custoDepreciacaoUnitario.toFixed(2)),
    custoDepreciacaoTotal: Number(custoDepreciacaoTotal.toFixed(2)),

    // Mão de Obra e Setup
    taxaSetupTotal: Number(taxaSetupTotal.toFixed(2)),
    custoComplexidadeUnitario: Number(custoComplexidadeUnitario.toFixed(2)),
    custoComplexidadeTotal: Number(custoComplexidadeTotal.toFixed(2)),
    complexidadeRotulo: obterRotuloComplexidade(complexidade),
    tempoMaoDeObraMinutosTotal: Math.round(tempoMaoDeObraMinutosTotal),
    custoMaoDeObraUnitario: Number(custoMaoDeObraUnitario.toFixed(2)),
    custoMaoDeObraTotal: Number(custoMaoDeObraTotal.toFixed(2)),

    custoInsumosUnitario: Number(custoInsumosUnitario.toFixed(2)),
    custoInsumosTotal: Number(custoInsumosTotal.toFixed(2)),

    custoDiretoUnitario: Number(custoDiretoUnitario.toFixed(2)),
    custoDiretoTotal: Number(custoDiretoTotal.toFixed(2)),

    margemBrutaPercentualOriginal: margemBase,
    descontoLotePercentual,
    margemBrutaPercentualEfetiva: Number(margemBrutaPercentualEfetiva.toFixed(2)),
    valorLucroTotal: Number(valorLucroTotal.toFixed(2)),

    precoSubtotalTotal: Number(precoSubtotalTotal.toFixed(2)),
    precoSubtotalUnitario: Number(precoSubtotalUnitario.toFixed(2)),

    valorDescontoComercialTotal: Number(valorDescontoComercialTotal.toFixed(2)),

    precoFinalPadraoTotal: Number(precoFinalPadraoTotal.toFixed(2)),
    precoFinalPadraoUnitario: Number(precoFinalPadraoUnitario.toFixed(2)),

    descontoAVistaPercentual,
    valorDescontoAVista: Number(valorDescontoAVista.toFixed(2)),
    precoFinalAVistaTotal: Number(precoFinalAVistaTotal.toFixed(2)),
    precoFinalAVistaUnitario: Number(precoFinalAVistaUnitario.toFixed(2)),

    cargaHorariaTotal: Number(tempoHorasTotal.toFixed(2)),
    prazoEstimadoSugerido: sugerido,
    prazoFinalAdotado: final,

    margemContribuicaoTotal: Number(margemContribuicaoTotal.toFixed(2)),
    margemContribuicaoPorHora: Number(margemContribuicaoPorHora.toFixed(2)),
  };
}

/**
 * Cálculo de Indicadores para Análise de Break-Even (Ponto de Equilíbrio)
 */
export function calcularBreakEven(
  config: ConfiguracoesGlobais,
  orcamentos: Orcamento[],
  mesReferencia?: { ano: number; mes: number }
): BreakEvenIndicadores {
  const amortizacaoMensalImpressora =
    config.mesesAmortizacao > 0
      ? (config.valorAquisicaoImpressora || 0) / config.mesesAmortizacao
      : 0;

  const custoFixoMensalTotal = (config.custosFixosMensais || 0) + amortizacaoMensalImpressora;

  // Filtrar orçamentos aprovados ou entregues no mês de referência
  const agora = new Date();
  const targetAno = mesReferencia ? mesReferencia.ano : agora.getFullYear();
  const targetMes = mesReferencia ? mesReferencia.mes : agora.getMonth();

  const orcamentosMes = orcamentos.filter((orc) => {
    if (orc.status !== 'Aprovado' && orc.status !== 'Entregue') return false;
    const d = new Date(orc.dataCriacao);
    return d.getFullYear() === targetAno && d.getMonth() === targetMes;
  });

  let horasFaturadasMesAtual = 0;
  let faturamentoMesAtual = 0;
  let margemContribuicaoSoma = 0;
  let totalPecas = 0;

  for (const orc of orcamentosMes) {
    horasFaturadasMesAtual += orc.resultado.cargaHorariaTotal || 0;
    faturamentoMesAtual += orc.resultado.precoFinalPadraoTotal || 0;
    margemContribuicaoSoma += orc.resultado.margemContribuicaoTotal || 0;
    totalPecas += orc.item?.quantidadeLote || 1;
  }

  // Margem de contribuição média por hora
  let margemContribuicaoMediaPorHora =
    horasFaturadasMesAtual > 0
      ? margemContribuicaoSoma / horasFaturadasMesAtual
      : 0;

  // Se não houver orçamentos no mês ainda, estimamos pela média de todos os orçamentos existentes ou default razoável
  if (margemContribuicaoMediaPorHora <= 0) {
    const todosValidos = orcamentos.filter((o) => o.resultado && o.resultado.cargaHorariaTotal > 0);
    if (todosValidos.length > 0) {
      const somaMg = todosValidos.reduce((acc, curr) => acc + curr.resultado.margemContribuicaoTotal, 0);
      const somaH = todosValidos.reduce((acc, curr) => acc + curr.resultado.cargaHorariaTotal, 0);
      margemContribuicaoMediaPorHora = somaH > 0 ? somaMg / somaH : 10;
    } else {
      // Valor base de referência
      margemContribuicaoMediaPorHora = 12.0;
    }
  }

  const horasNecessariasBreakEven =
    margemContribuicaoMediaPorHora > 0
      ? custoFixoMensalTotal / margemContribuicaoMediaPorHora
      : 0;

  const percentualAtingidoHoras =
    horasNecessariasBreakEven > 0
      ? Math.min(250, (horasFaturadasMesAtual / horasNecessariasBreakEven) * 100)
      : 0;

  const ticketMedioUnitario = totalPecas > 0 ? faturamentoMesAtual / totalPecas : 50;
  const margemUnitarioMedia = totalPecas > 0 ? margemContribuicaoSoma / totalPecas : 20;

  const pecasNecessariasBreakEven =
    margemUnitarioMedia > 0
      ? Math.ceil(custoFixoMensalTotal / margemUnitarioMedia)
      : 0;

  const atingiuBreakEven = horasFaturadasMesAtual >= horasNecessariasBreakEven;
  const lucroLiquidoEstimadoMes = margemContribuicaoSoma - custoFixoMensalTotal;

  return {
    custoFixoMensalTotal: Number(custoFixoMensalTotal.toFixed(2)),
    amortizacaoMensalImpressora: Number(amortizacaoMensalImpressora.toFixed(2)),
    horasFaturadasMesAtual: Number(horasFaturadasMesAtual.toFixed(2)),
    faturamentoMesAtual: Number(faturamentoMesAtual.toFixed(2)),
    margemContribuicaoMediaPorHora: Number(margemContribuicaoMediaPorHora.toFixed(2)),
    horasNecessariasBreakEven: Number(horasNecessariasBreakEven.toFixed(1)),
    percentualAtingidoHoras: Number(percentualAtingidoHoras.toFixed(1)),
    ticketMedioUnitario: Number(ticketMedioUnitario.toFixed(2)),
    pecasNecessariasBreakEven,
    atingiuBreakEven,
    lucroLiquidoEstimadoMes: Number(lucroLiquidoEstimadoMes.toFixed(2)),
  };
}

export const PRESETS_SERVICOS_HARDWARE: Array<{
  id: string;
  nome: string;
  descricao: string;
  precoSugerido: number;
}> = [
  {
    id: 'limpeza_preventiva',
    nome: 'Limpeza Preventiva Simples',
    descricao: 'Despoeiramento interno, limpeza de coolers e desobstrução das saídas de ar.',
    precoSugerido: 80,
  },
  {
    id: 'limpeza_completa',
    nome: 'Limpeza Completa + Troca de Pasta Térmica',
    descricao: 'Desmontagem técnica, limpeza química de dissipadores, aplicação de pasta térmica de alta performance e lubrificação de ventoinhas.',
    precoSugerido: 140,
  },
  {
    id: 'formatacao_limpa',
    nome: 'Formatação Limpa + Drivers',
    descricao: 'Instalação limpa do Windows ou Linux, partição otimizada, drivers homologados e pacote utilitário essencial.',
    precoSugerido: 100,
  },
  {
    id: 'upgrade_ssd_os',
    nome: 'Instalação de SSD + Sistema Operacional (Windows/Linux) + Drivers',
    descricao: 'Instalação física do SSD, instalação limpa do SO com particionamento otimizado, configuração de drivers oficiais e testes de velocidade.',
    precoSugerido: 130,
  },
  {
    id: 'diagnostico_bancada',
    nome: 'Diagnóstico Técnico Avançado',
    descricao: 'Análise detalhada de falhas intermitentes, testes de estresse em bancada e laudo pericial.',
    precoSugerido: 70,
  },
];

/**
 * Simulação de Parcelamento no Cartão de Crédito com Juros Escalonados
 * - 1x: Sem juros adicionais (0% de acréscimo)
 * - 2x a 6x: Taxa intermediária (padrão: 5.5% ou configurada)
 * - 7x a 12x: Taxa estendida (padrão: 10.5% ou configurada)
 */
export function calcularOpcoesParcelamento(
  valorBasePadrao: number,
  config?: ConfiguracoesGlobais,
  arredondar: boolean = false
): OpcaoParcelamento[] {
  const taxa2a6 = config?.taxaJurosCartao2a6 ?? 5.5;
  const taxa7a12 = config?.taxaJurosCartao7a12 ?? 10.5;

  const opcoes: OpcaoParcelamento[] = [];

  for (let n = 1; n <= 12; n++) {
    let taxa = 0;
    if (n >= 2 && n <= 6) {
      taxa = taxa2a6;
    } else if (n >= 7) {
      taxa = taxa7a12;
    }

    let valorTotal = valorBasePadrao * (1 + taxa / 100);
    if (arredondar) {
      valorTotal = aplicarArredondamentoInteligente(valorTotal, true);
    }
    const valorParcela = n > 0 ? valorTotal / n : valorTotal;

    opcoes.push({
      parcelas: n,
      taxaJurosPercentual: taxa,
      valorTotal: Number(valorTotal.toFixed(2)),
      valorParcela: Number(valorParcela.toFixed(2)),
    });
  }

  return opcoes;
}

/**
 * Motor Financeiro para Serviços de Bancada / Manutenção de Hardware
 */
export function calcularOrcamentoHardware(
  hardwareItem: HardwareItemOrcamento,
  config: ConfiguracoesGlobais
): CalculoOrcamentoResultado {
  // 1. Taxa de Risco de Responsabilidade Técnica sobre Equipamentos de Alto Valor
  const limiteAltoValor = config.limiteAltoValorHardware ?? 5000;
  const percentualRisco = config.percentualTaxaRiscoHardware ?? 3;
  let taxaRisco = 0;
  if ((hardwareItem.valorEstimadoEquipamento || 0) > limiteAltoValor) {
    taxaRisco = ((hardwareItem.valorEstimadoEquipamento || 0) * percentualRisco) / 100;
  }

  // 2. Mão de Obra e Serviços de Bancada
  let somaServicosPresets = 0;
  const servicosIds = hardwareItem.servicosIds || [];
  for (const sId of servicosIds) {
    const preset = PRESETS_SERVICOS_HARDWARE.find((p) => p.id === sId);
    if (preset) {
      somaServicosPresets += preset.precoSugerido;
    }
  }

  let somaServicosCustom = 0;
  if (hardwareItem.servicosCustomizados && hardwareItem.servicosCustomizados.length > 0) {
    for (const sCustom of hardwareItem.servicosCustomizados) {
      somaServicosCustom += Number(sCustom.valor) || 0;
    }
  }

  const totalServicosMaoDeObra = somaServicosPresets + somaServicosCustom;

  // 3. Insumos Fracionados de Bancada (Custo Operacional Interno)
  // Pasta térmica e insumos químicos são tratados estritamente como custo operacional interno embutido na mão de obra.
  // NÃO são repassados como taxa extra para o cliente, mas entram no custo direto interno para cálculo de margem e Break-Even.
  const custoPastaTermica = hardwareItem.incluiPastaTermica
    ? (config.custoPastaTermica ?? 10)
    : 0;
  const custoInsumosBancada = hardwareItem.incluiInsumosLimpeza
    ? (config.custoInsumosBancada ?? 6)
    : 0;
  const totalInsumosInternos = custoPastaTermica + custoInsumosBancada;

  // 4. Peças de Reposição e Upgrades (Hardware Real Repassado ao Cliente)
  let custoTotalPecas = 0;
  let vendaTotalPecas = 0;
  if (hardwareItem.pecas && hardwareItem.pecas.length > 0) {
    for (const peca of hardwareItem.pecas) {
      const custo = Number(peca.precoCusto) || 0;
      const venda = Number(peca.precoVenda) || 0;
      custoTotalPecas += custo;
      vendaTotalPecas += venda;
    }
  }

  // 5. Custos Diretos Internos e Totais Comerciais
  // Custo Direto Interno = Peças + Insumos Operacionais
  const custoDiretoTotal = custoTotalPecas + totalInsumosInternos;
  // Subtotal Cobrado do Cliente = Mão de Obra + Taxa de Risco + Peças (Insumos já embutidos na mão de obra!)
  const precoSubtotalTotal = totalServicosMaoDeObra + taxaRisco + vendaTotalPecas;

  // Desconto Comercial Avulso
  let valorDescontoComercialTotal = 0;
  if (hardwareItem.descontoComercialValor && hardwareItem.descontoComercialValor > 0) {
    if (hardwareItem.descontoComercialTipo === 'percentual') {
      valorDescontoComercialTotal = precoSubtotalTotal * (hardwareItem.descontoComercialValor / 100);
    } else {
      valorDescontoComercialTotal = Math.min(precoSubtotalTotal, hardwareItem.descontoComercialValor);
    }
  }

  const precoAposDescontoComercialTotal = Math.max(0, precoSubtotalTotal - valorDescontoComercialTotal);

  const precoFinalPadraoTotal = aplicarArredondamentoInteligente(
    precoAposDescontoComercialTotal,
    config.arredondamentoAtivo
  );

  const descontoAVistaPercentual = config.descontoAVistaPix ?? 8;
  const valorDescontoAVista = (precoFinalPadraoTotal * descontoAVistaPercentual) / 100;
  const precoFinalAVistaTotal = aplicarArredondamentoInteligente(
    precoFinalPadraoTotal - valorDescontoAVista,
    config.arredondamentoAtivo
  );

  // 6. Simulação de Parcelamento no Cartão (Juros Escalonados)
  const parcelasCartao = Math.max(1, Math.min(12, hardwareItem.parcelasCartao || 1));
  const opcoesParcelamento = calcularOpcoesParcelamento(precoFinalPadraoTotal, config, false);
  const opcaoSelecionada =
    opcoesParcelamento.find((o) => o.parcelas === parcelasCartao) || opcoesParcelamento[0];
  const taxaJurosCartaoPercentual = opcaoSelecionada.taxaJurosPercentual;
  const valorTotalParcelado = opcaoSelecionada.valorTotal;
  const valorParcelaIndividual = opcaoSelecionada.valorParcela;

  // Estimativa de horas de bancada para Break-Even (1.5h por serviço selecionado)
  const totalServicosContagem = servicosIds.length + (hardwareItem.servicosCustomizados?.length || 0);
  const cargaHorariaTotal = Math.max(1, totalServicosContagem * 1.5);

  // Margem de Contribuição = Preço de Venda Final - Custos Variáveis Diretos (Peças + Insumos Operacionais)
  const margemContribuicaoTotal = Math.max(0, precoFinalPadraoTotal - custoDiretoTotal);
  const margemContribuicaoPorHora =
    cargaHorariaTotal > 0 ? margemContribuicaoTotal / cargaHorariaTotal : 0;

  const diasPrazo = hardwareItem.prazoEstimadoDias || 2;
  const prazoFinal = diasPrazo === 1 ? '1 dia útil' : `${diasPrazo} dias úteis`;

  return {
    detalhamentoMateriais: [],
    pesoTotalLoteGramas: 0,
    custoMateriaPrimaUnitario: 0,
    custoMateriaPrimaTotal: 0,
    alertaSaldoInsuficienteGeral: false,

    tempoHorasTotal: cargaHorariaTotal,
    consumoKwhTotal: 0,
    custoEnergiaUnitario: 0,
    custoEnergiaTotal: 0,

    custoDepreciacaoUnitario: 0,
    custoDepreciacaoTotal: 0,

    taxaSetupTotal: 0,
    custoComplexidadeUnitario: 0,
    custoComplexidadeTotal: 0,
    complexidadeRotulo: 'Serviço de Bancada Especializado',
    tempoMaoDeObraMinutosTotal: cargaHorariaTotal * 60,
    custoMaoDeObraUnitario: Number((totalServicosMaoDeObra + taxaRisco).toFixed(2)),
    custoMaoDeObraTotal: Number((totalServicosMaoDeObra + taxaRisco).toFixed(2)),

    custoInsumosUnitario: Number(totalInsumosInternos.toFixed(2)),
    custoInsumosTotal: Number(totalInsumosInternos.toFixed(2)),

    custoDiretoUnitario: Number(custoDiretoTotal.toFixed(2)),
    custoDiretoTotal: Number(custoDiretoTotal.toFixed(2)),

    margemBrutaPercentualOriginal: 0,
    descontoLotePercentual: 0,
    margemBrutaPercentualEfetiva: 0,
    valorLucroTotal: Number(margemContribuicaoTotal.toFixed(2)),

    precoSubtotalTotal: Number(precoSubtotalTotal.toFixed(2)),
    precoSubtotalUnitario: Number(precoSubtotalTotal.toFixed(2)),

    valorDescontoComercialTotal: Number(valorDescontoComercialTotal.toFixed(2)),

    precoFinalPadraoTotal: Number(precoFinalPadraoTotal.toFixed(2)),
    precoFinalPadraoUnitario: Number(precoFinalPadraoTotal.toFixed(2)),

    descontoAVistaPercentual,
    valorDescontoAVista: Number(valorDescontoAVista.toFixed(2)),
    precoFinalAVistaTotal: Number(precoFinalAVistaTotal.toFixed(2)),
    precoFinalAVistaUnitario: Number(precoFinalAVistaTotal.toFixed(2)),

    // Parcelamento Cartão
    parcelasCartao,
    taxaJurosCartaoPercentual,
    valorTotalParcelado,
    valorParcelaIndividual,
    opcoesParcelamento,

    cargaHorariaTotal,
    prazoEstimadoSugerido: prazoFinal,
    prazoFinalAdotado: prazoFinal,

    margemContribuicaoTotal: Number(margemContribuicaoTotal.toFixed(2)),
    margemContribuicaoPorHora: Number(margemContribuicaoPorHora.toFixed(2)),
  };
}
