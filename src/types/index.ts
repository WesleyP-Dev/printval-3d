export type TipoMaterial = 'PLA' | 'PETG' | 'ABS' | 'TPU' | 'ASA' | 'Resina' | 'Outro';

export interface HistoricoPrecoItem {
  data: string; // ISO ou YYYY-MM-DD
  preco: number;
}

export interface Filamento {
  id: string;
  nome: string;
  marca: string;
  tipo: TipoMaterial;
  corHex: string;
  corNome: string;
  pesoTotalGramas: number;
  pesoRestanteGramas: number;
  precoAtual: number;
  fatorQualidadeRisco: number;
  favorito: boolean;
  historicoPreco: HistoricoPrecoItem[];
}

export interface InsumoSecundario {
  id: string;
  nome: string;
  custoUnitario: number;
  aplicarPor: 'unidade' | 'lote';
  quantidade: number;
}

export interface RegraDescontoLote {
  minUnidades: number;
  maxUnidades?: number;
  percentualDesconto: number;
}

export type ComplexidadePosProcesso = 'nenhum' | 'simples' | 'medio' | 'complexo' | 'manual';

export interface PresetsComplexidadeConfig {
  nenhum: number;   // Padrão: R$ 0,00 (direto da mesa, sem suportes)
  simples: number;  // Padrão: R$ 6,00 (pouco suporte / remoção rápida de brim)
  medio: number;    // Padrão: R$ 14,00 (suportes moderados, rebarbas, encaixes)
  complexo: number; // Padrão: R$ 28,00 (miniaturas, suportes delicados, lixamento manual)
}

export interface ConfiguracoesGlobais {
  custoKwh: number;
  potenciaImpressoraW: number;
  taxaDepreciacaoManutencaoHora: number;
  margemLucroBase: number; // ex: 45 para 45%
  taxaHorariaOperador: number;
  
  // Sistema de Mão de Obra e Setup
  taxaSetupFixo: number; // Padrão: R$ 8,00
  presetsComplexidade: PresetsComplexidadeConfig;

  // Retrocompatibilidade opcional
  modoMaoDeObra?: 'manual' | 'automatico';
  percentualMaoDeObraAuto?: number;

  descontoAVistaPix: number; // ex: 8%
  regrasDescontoLote: RegraDescontoLote[];
  arredondamentoAtivo: boolean;
  // Break-even
  custosFixosMensais: number;
  valorAquisicaoImpressora: number;
  mesesAmortizacao: number;
  // Perfil da empresa / oficina 3D
  nomeEmpresa: string;
  telefoneEmpresa: string;
  chavePix: string;
  carteiraBinancePay?: string;
  // Google Drive
  googleClientId?: string;

  // Parâmetros de Manutenção de Computadores (Hardware & TI)
  custoPastaTermica?: number; // Padrão: R$ 10,00
  custoInsumosBancada?: number; // Padrão: R$ 6,00
  markupPadraoPecas?: number; // Padrão: 20% (para peças compradas)
  percentualTaxaRiscoHardware?: number; // Padrão: 3% sobre valor da máquina
  limiteAltoValorHardware?: number; // Padrão: R$ 5.000,00
  taxaJurosCartao2a6?: number; // Padrão: 5.5% (2x a 6x)
  taxaJurosCartao7a12?: number; // Padrão: 10.5% (7x a 12x)
}

// Módulo de Múltiplos Materiais / Cores
export interface MaterialItemOrcamento {
  id: string;
  filamentoId: string;
  pesoGramas: number; // Gramatura total consumida no fatiamento para esta cor/parte
  rotuloParte?: string; // Ex: "Corpo", "Detalhes", "Tampa"
}

export interface DetalheMaterialResultado {
  filamentoId: string;
  filamentoNome: string;
  marca: string;
  tipo: TipoMaterial;
  corHex: string;
  corNome: string;
  pesoTotalGramas: number;
  pesoUnitarioGramas: number;
  custoPorGrama: number;
  fatorQualidadeRisco: number;
  custoTotal: number;
  custoUnitario: number;
  saldoDisponivel: number;
  saldoInsuficiente: boolean;
  rotuloParte?: string;
}

export interface ItemOrcamento {
  // Lista dinâmica de materiais / cores
  materiais: MaterialItemOrcamento[];

  // Campos legados para compatibilidade
  filamentoId?: string;
  pesoPecaGramas?: number;

  tempoImpressaoHoras: number;
  tempoImpressaoMinutos: number;
  quantidadeLote: number;
  
  // Pós-Processamento e Mão de Obra
  complexidadePosProcesso: ComplexidadePosProcesso;
  valorMaoDeObraManual?: number;
  tempoMaoDeObraManualMinutos?: number;
  taxaSetupManualOverride?: number;

  // Retrocompatibilidade
  modoMaoDeObra?: 'manual' | 'automatico';

  insumosSecundarios: InsumoSecundario[];
  descontoComercialTipo: 'percentual' | 'fixo';
  descontoComercialValor: number;
  prazoManualOverride?: string;
}

export interface CalculoOrcamentoResultado {
  // Matéria-prima Consolidada e Detalhada
  detalhamentoMateriais: DetalheMaterialResultado[];
  pesoTotalLoteGramas: number;
  custoMateriaPrimaUnitario: number;
  custoMateriaPrimaTotal: number;
  alertaSaldoInsuficienteGeral: boolean;

  // Energia
  tempoHorasTotal: number;
  consumoKwhTotal: number;
  custoEnergiaUnitario: number;
  custoEnergiaTotal: number;

  // Depreciação / Manutenção de máquina
  custoDepreciacaoUnitario: number;
  custoDepreciacaoTotal: number;

  // Mão de obra e pós-processamento (Setup + Complexidade)
  taxaSetupTotal: number;
  custoComplexidadeUnitario: number;
  custoComplexidadeTotal: number;
  complexidadeRotulo: string;
  tempoMaoDeObraMinutosTotal?: number;
  custoMaoDeObraUnitario: number;
  custoMaoDeObraTotal: number;

  // Insumos secundários (embalagens, insertos, etc)
  custoInsumosUnitario: number;
  custoInsumosTotal: number;

  // Custo Direto Consolidado
  custoDiretoUnitario: number;
  custoDiretoTotal: number;

  // Margem e Lucro
  margemBrutaPercentualOriginal: number;
  descontoLotePercentual: number;
  margemBrutaPercentualEfetiva: number;
  valorLucroTotal: number;

  // Subtotal antes de descontos comerciais
  precoSubtotalTotal: number;
  precoSubtotalUnitario: number;

  // Descontos Comerciais
  valorDescontoComercialTotal: number;

  // Preço Final Padrão (Cartão / Parcelado)
  precoFinalPadraoTotal: number;
  precoFinalPadraoUnitario: number;

  // Preço Final à Vista (Pix / Binance Pay / Dinheiro)
  descontoAVistaPercentual: number;
  valorDescontoAVista: number;
  precoFinalAVistaTotal: number;
  precoFinalAVistaUnitario: number;

  // Prazo Comercial
  cargaHorariaTotal: number;
  prazoEstimadoSugerido: string;
  prazoFinalAdotado: string;

  // Margem de Contribuição Horária para Break-Even
  margemContribuicaoTotal: number;
  margemContribuicaoPorHora: number;

  // Simulação de Parcelamento no Cartão (Juros Escalonados)
  parcelasCartao?: number;
  taxaJurosCartaoPercentual?: number;
  valorTotalParcelado?: number;
  valorParcelaIndividual?: number;
  opcoesParcelamento?: OpcaoParcelamento[];
}

export interface OpcaoParcelamento {
  parcelas: number;
  taxaJurosPercentual: number;
  valorTotal: number;
  valorParcela: number;
}

export type CategoriaOrcamento = 'impressao_3d' | 'manutencao_hardware';

export type TipoEquipamentoHardware =
  | 'notebook_convencional'
  | 'notebook_gamer'
  | 'desktop_torre'
  | 'all_in_one'
  | 'macbook_minipc';

export interface HardwareChecklist {
  ligaDaVideo: boolean;
  bateriaCarrega: boolean;
  telaIntegra: boolean;
  avariasPreexistentes: boolean;
  parafusosFaltando: boolean;
  falhaConectorDobradica: boolean;
}

export interface ServicoHardwareItem {
  id: string;
  nome: string;
  valor: number;
}

export interface PecaHardwareOrcamento {
  id: string;
  descricao: string;
  precoCusto: number;
  markupPercentual: number;
  precoVenda: number;
}

export interface HardwareItemOrcamento {
  tipoEquipamento: TipoEquipamentoHardware;
  marca: string;
  modelo: string;
  numeroSerie: string;
  checklist: HardwareChecklist;
  sintomasRelatados: string;
  servicosIds: string[];
  servicosCustomizados?: ServicoHardwareItem[];
  valorEstimadoEquipamento: number;
  taxaRiscoAplicada: number;
  incluiPastaTermica: boolean;
  incluiInsumosLimpeza: boolean;
  pecas: PecaHardwareOrcamento[];
  prazoEstimadoDias?: number;
  descontoComercialTipo?: 'percentual' | 'fixo';
  descontoComercialValor?: number;
  parcelasCartao?: number;
}

export type ModoDocumentoHardware = 'orcamento' | 'termo_os';

export interface GerarPDFOptions {
  modoHardware?: ModoDocumentoHardware;
}

export type StatusOrcamento = 'Pendente' | 'Aprovado' | 'Entregue' | 'Cancelado';

export interface Orcamento {
  id: string;
  numero: string;
  categoria?: CategoriaOrcamento; // 'impressao_3d' (padrão) ou 'manutencao_hardware'
  dataCriacao: string;
  clienteNome: string;
  clienteTelefone?: string;
  clienteEmail?: string;
  projetoNome: string;
  descricao?: string;

  // Específico para Impressão 3D
  item?: ItemOrcamento;
  filamentoSnapshot?: Filamento; // Filamento principal ou primeiro
  materiaisSnapshots?: Filamento[]; // Lista de todos os filamentos envolvidos
  descontouEstoque?: boolean;

  // Específico para Manutenção de Hardware & TI
  hardwareItem?: HardwareItemOrcamento;

  resultado: CalculoOrcamentoResultado;
  status: StatusOrcamento;
}

export interface BreakEvenIndicadores {
  custoFixoMensalTotal: number;
  amortizacaoMensalImpressora: number;
  horasFaturadasMesAtual: number;
  faturamentoMesAtual: number;
  margemContribuicaoMediaPorHora: number;
  horasNecessariasBreakEven: number;
  percentualAtingidoHoras: number;
  ticketMedioUnitario: number;
  pecasNecessariasBreakEven: number;
  atingiuBreakEven: boolean;
  lucroLiquidoEstimadoMes: number;
}

export interface AppDataState {
  filamentos: Filamento[];
  orcamentos: Orcamento[];
  configuracoes: ConfiguracoesGlobais;
  ultimaSincronizacao?: string;
}
