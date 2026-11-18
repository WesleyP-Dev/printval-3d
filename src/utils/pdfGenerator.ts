import { Orcamento, ConfiguracoesGlobais, GerarPDFOptions, ModoDocumentoHardware } from '../types';
import { PRESETS_SERVICOS_HARDWARE } from './pricingEngine';

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor || 0);
}

export function formatarData(dataString: string): string {
  try {
    const d = new Date(dataString);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dataString;
  }
}

export async function gerarPropostaPDF(
  orcamento: Orcamento,
  config: ConfiguracoesGlobais,
  options?: GerarPDFOptions
): Promise<void> {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  if (orcamento.categoria === 'manutencao_hardware') {
    await gerarPDFHardware(doc, autoTable, orcamento, config, options?.modoHardware ?? 'termo_os');
  } else {
    await gerarPDFImpressao3D(doc, autoTable, orcamento, config);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function gerarPDFHardware(
  doc: any,
  autoTable: any,
  orcamento: Orcamento,
  config: ConfiguracoesGlobais,
  modoHardware: ModoDocumentoHardware = 'termo_os'
): Promise<void> {
  const roxoPrimario = [99, 102, 241]; // #6366f1
  const cinzaEscuro = [30, 41, 59];
  const cinzaClaro = [248, 250, 252];
  const hw = orcamento.hardwareItem;

  // 1. Barra Superior Decorativa
  doc.setFillColor(roxoPrimario[0], roxoPrimario[1], roxoPrimario[2]);
  doc.rect(0, 0, 210, 8, 'F');

  // 2. Cabeçalho
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(cinzaEscuro[0], cinzaEscuro[1], cinzaEscuro[2]);
  doc.text(config.nomeEmpresa || 'ASSISTÊNCIA TÉCNICA ESPECIALIZADA', 14, 21);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  if (modoHardware === 'orcamento') {
    doc.text('Manutenção de Computadores • Proposta Comercial & Serviços de Bancada', 14, 26);
  } else {
    doc.text('Manutenção de Computadores • Serviços de Bancada & Laudo Pericial de Entrada', 14, 26);
  }

  if (config.telefoneEmpresa) {
    doc.text(`Contato: ${config.telefoneEmpresa}`, 14, 30);
  }

  // Bloco Direita
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(roxoPrimario[0], roxoPrimario[1], roxoPrimario[2]);
  if (modoHardware === 'orcamento') {
    doc.text(`ORÇAMENTO DE SERVIÇOS`, 196, 20, { align: 'right' });
  } else {
    doc.text(`ORDEM DE SERVIÇO & TERMO DE RECEPÇÃO`, 196, 20, { align: 'right' });
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(cinzaEscuro[0], cinzaEscuro[1], cinzaEscuro[2]);
  doc.text(`Nº: ${orcamento.numero}`, 196, 25, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Data: ${formatarData(orcamento.dataCriacao)}`, 196, 30, { align: 'right' });
  doc.text(`Validade: 10 dias úteis`, 196, 35, { align: 'right' });

  // Linha divisória
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 38, 196, 38);

  // 3. Informações do Cliente e do Equipamento (Layout sem sobreposição com deslocamento dinâmico)
  doc.setFillColor(cinzaClaro[0], cinzaClaro[1], cinzaClaro[2]);
  doc.roundedRect(14, 41, 182, 30, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 41, 182, 30, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(roxoPrimario[0], roxoPrimario[1], roxoPrimario[2]);
  doc.text('DADOS DO CLIENTE & IDENTIFICAÇÃO DO EQUIPAMENTO', 18, 46);

  doc.setFontSize(9);
  doc.setTextColor(cinzaEscuro[0], cinzaEscuro[1], cinzaEscuro[2]);

  // Cliente & WhatsApp
  doc.setFont('helvetica', 'bold');
  const labelCliente = 'Cliente: ';
  const wCliente = doc.getTextWidth(labelCliente);
  doc.text(labelCliente, 18, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(orcamento.clienteNome || 'Não informado', 18 + wCliente, 52, { maxWidth: 90 });

  doc.setFont('helvetica', 'bold');
  const labelZap = 'WhatsApp: ';
  const wZap = doc.getTextWidth(labelZap);
  doc.text(labelZap, 115, 52);
  doc.setFont('helvetica', 'normal');
  doc.text(orcamento.clienteTelefone || 'Não informado', 115 + wZap, 52);

  const rotuloTipo: Record<string, string> = {
    notebook_convencional: 'Notebook Convencional',
    notebook_gamer: 'Notebook Gamer / Workstation',
    desktop_torre: 'Desktop Torre',
    all_in_one: 'All-in-One',
    macbook_minipc: 'MacBook / Mini PC',
  };

  const tipoStr = rotuloTipo[hw?.tipoEquipamento || ''] || 'Computador';
  const equipStr = `${tipoStr} • ${hw?.marca || ''} ${hw?.modelo || ''}`.trim();
  doc.setFont('helvetica', 'bold');
  const labelEquip = 'Equipamento: ';
  const wEquip = doc.getTextWidth(labelEquip);
  doc.text(labelEquip, 18, 58);
  doc.setFont('helvetica', 'normal');
  doc.text(equipStr || 'Não especificado', 18 + wEquip, 58, { maxWidth: 90 });

  doc.setFont('helvetica', 'bold');
  const labelSerie = 'Nº Série / Tag: ';
  const wSerie = doc.getTextWidth(labelSerie);
  doc.text(labelSerie, 115, 58);
  doc.setFont('helvetica', 'normal');
  doc.text(hw?.numeroSerie || 'Sem identificação', 115 + wSerie, 58);

  // Sintomas Relatados - Cálculo dinâmico de x via getTextWidth garantindo zero colisão
  doc.setFont('helvetica', 'bold');
  const labelSintomas = 'Sintomas Relatados: ';
  const wSintomas = doc.getTextWidth(labelSintomas);
  doc.text(labelSintomas, 18, 64);
  doc.setFont('helvetica', 'normal');
  const sintomasStr = hw?.sintomasRelatados || 'Manutenção e revisão de bancada';
  doc.text(sintomasStr, 18 + wSintomas, 64, { maxWidth: 196 - (18 + wSintomas + 3) });

  // 4. Checklist Pericial de Entrada (Apenas no Modo B: Termo & OS)
  if (modoHardware === 'termo_os') {
    doc.setFillColor(241, 245, 249);
    doc.roundedRect(14, 73, 182, 19, 2, 2, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(14, 73, 182, 19, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(roxoPrimario[0], roxoPrimario[1], roxoPrimario[2]);
    doc.text('CHECKLIST PERICIAL DE ENTRADA (ESTADO FÍSICO NA RECEPÇÃO):', 18, 77.5);

    const cl = hw?.checklist;
    const statusCheck = (val?: boolean) => (val ? '[X] SIM' : '[ ] NÃO');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.setTextColor(cinzaEscuro[0], cinzaEscuro[1], cinzaEscuro[2]);
    doc.text(`• Liga e Apresenta Vídeo: ${statusCheck(cl?.ligaDaVideo)}`, 18, 83);
    doc.text(`• Bateria Carrega: ${statusCheck(cl?.bateriaCarrega)}`, 80, 83);
    doc.text(`• Tela Íntegra: ${statusCheck(cl?.telaIntegra)}`, 140, 83);

    doc.text(`• Avarias / Riscos: ${statusCheck(cl?.avariasPreexistentes)}`, 18, 88);
    doc.text(`• Parafusos Faltando: ${statusCheck(cl?.parafusosFaltando)}`, 80, 88);
    doc.text(`• Conector / Dobradiça: ${statusCheck(cl?.falhaConectorDobradica)}`, 140, 88);
  }

  // 5. Tabela de Serviços e Peças
  const bodyData: string[][] = [];
  let itemCounter = 1;

  // Serviços selecionados
  for (const sId of hw?.servicosIds || []) {
    const preset = PRESETS_SERVICOS_HARDWARE.find((p) => p.id === sId);
    if (preset) {
      bodyData.push([
        String(itemCounter++),
        `Serviço: ${preset.nome}\n${preset.descricao}`,
        '1 sv',
        formatarMoeda(preset.precoSugerido),
        formatarMoeda(preset.precoSugerido),
      ]);
    }
  }

  // Serviços customizados
  for (const sc of hw?.servicosCustomizados || []) {
    bodyData.push([
      String(itemCounter++),
      `Serviço Especializado: ${sc.nome}`,
      '1 sv',
      formatarMoeda(sc.valor),
      formatarMoeda(sc.valor),
    ]);
  }

  // Taxa de risco
  if (hw && hw.taxaRiscoAplicada > 0) {
    bodyData.push([
      String(itemCounter++),
      `Taxa de Responsabilidade Técnica (${config.percentualTaxaRiscoHardware ?? 3}% sobre valor de mercado > ${formatarMoeda(config.limiteAltoValorHardware ?? 5000)})`,
      '1 tx',
      formatarMoeda(hw.taxaRiscoAplicada),
      formatarMoeda(hw.taxaRiscoAplicada),
    ]);
  }

  // Peças de reposição
  for (const p of hw?.pecas || []) {
    bodyData.push([
      String(itemCounter++),
      `Peça / Upgrade: ${p.descricao}`,
      '1 un',
      formatarMoeda(p.precoVenda),
      formatarMoeda(p.precoVenda),
    ]);
  }

  autoTable(doc, {
    startY: modoHardware === 'termo_os' ? 95 : 75,
    head: [['#', 'Descrição do Serviço / Peça Aplicada', 'Qtd', 'Unitário', 'Total']],
    body: bodyData,
    theme: 'grid',
    headStyles: {
      fillColor: [99, 102, 241],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 105 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
    },
    styles: {
      fontSize: 8,
      cellPadding: 3.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || 165;
  const cardY = finalY + 6;

  // Box Esquerdo: Condições Comerciais ou Termo de Garantia Legal (Art. 26 CDC)
  doc.setFillColor(248, 250, 252);
  // Box Esquerdo: Condições Comerciais ou Termo de Garantia Legal (Art. 26 CDC)
  const boxHeight = 53;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, cardY, 98, boxHeight, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, cardY, 98, boxHeight, 2, 2, 'S');

  const taxa2a6 = config.taxaJurosCartao2a6 ?? 5.5;
  const taxa7a12 = config.taxaJurosCartao7a12 ?? 10.5;

  if (modoHardware === 'orcamento') {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(roxoPrimario[0], roxoPrimario[1], roxoPrimario[2]);
    doc.text('CONDIÇÕES COMERCIAIS & GARANTIA', 18, cardY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text(
      '• Orçamento válido por 10 dias úteis a contar da data de emissão desta proposta.',
      18,
      cardY + 11,
      { maxWidth: 90 }
    );
    doc.text(
      `• Prazo estimado de liberação: ${orcamento.resultado.prazoFinalAdotado} após a aprovação formal.`,
      18,
      cardY + 16,
      { maxWidth: 90 }
    );
    doc.text(
      '• Os serviços executados e peças substituídas possuem garantia técnica de 90 dias.',
      18,
      cardY + 21,
      { maxWidth: 90 }
    );
    doc.text(
      `• Parcelamento no cartão em até 12x (1x sem juros; 2x-6x: ${taxa2a6}%; 7x-12x: ${taxa7a12}%).`,
      18,
      cardY + 26,
      { maxWidth: 90 }
    );
    if (config.chavePix) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(cinzaEscuro[0], cinzaEscuro[1], cinzaEscuro[2]);
      doc.text(`Chave Pix: ${config.chavePix}`, 18, cardY + 36);
    }
    if (config.carteiraBinancePay) {
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Binance Pay ID: ${config.carteiraBinancePay}`, 18, cardY + 42);
    }
  } else {
    // Modo B: Termo de Recepção & Garantia CDC
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(roxoPrimario[0], roxoPrimario[1], roxoPrimario[2]);
    doc.text('GARANTIA LEGAL DE 90 DIAS (ART. 26 CDC)', 18, cardY + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.6);
    doc.setTextColor(71, 85, 105);
    doc.text(
      '• Conforme o Art. 26, II do CDC, os serviços e peças substituídas possuem garantia legal de 90 dias a contar da entrega.',
      18,
      cardY + 11,
      { maxWidth: 90 }
    );
    doc.text(
      '• A garantia não cobre danos por sobretensão na rede elétrica, contato com líquidos/umidade, quedas ou intervenção de terceiros.',
      18,
      cardY + 18,
      { maxWidth: 90 }
    );
    doc.text(
      `• Pagamento: Pix com desconto, 1x no cartão sem juros ou até 12x (2x-6x: ${taxa2a6}%; 7x-12x: ${taxa7a12}%).`,
      18,
      cardY + 26,
      { maxWidth: 90 }
    );
    doc.text(
      '• Equipamentos não retirados em até 90 dias após aviso de liberação poderão sofrer cobrança de armazenagem.',
      18,
      cardY + 33,
      { maxWidth: 90 }
    );
    if (config.chavePix) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(cinzaEscuro[0], cinzaEscuro[1], cinzaEscuro[2]);
      doc.text(`Chave Pix: ${config.chavePix}`, 18, cardY + 42);
    }
  }

  // Box Direito: Totais Financeiros
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(115, cardY, 81, boxHeight, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(115, cardY, 81, boxHeight, 2, 2, 'S');

  let posYTotais = cardY + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal Serviços + Peças:', 119, posYTotais);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(cinzaEscuro[0], cinzaEscuro[1], cinzaEscuro[2]);
  doc.text(formatarMoeda(orcamento.resultado.precoSubtotalTotal), 191, posYTotais, { align: 'right' });

  if (orcamento.resultado.valorDescontoComercialTotal > 0) {
    posYTotais += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(16, 185, 129);
    doc.text('Desconto Comercial:', 119, posYTotais);
    doc.text(`- ${formatarMoeda(orcamento.resultado.valorDescontoComercialTotal)}`, 191, posYTotais, { align: 'right' });
  }

  posYTotais += 4.8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Cartão 1x (s/ juros):', 119, posYTotais);
  doc.text(formatarMoeda(orcamento.resultado.precoFinalPadraoTotal), 191, posYTotais, { align: 'right' });

  if (orcamento.resultado.parcelasCartao && orcamento.resultado.parcelasCartao > 1) {
    posYTotais += 4.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(99, 102, 241);
    doc.text(`Cartão (${orcamento.resultado.parcelasCartao}x c/ juros):`, 119, posYTotais);
    doc.text(
      `${orcamento.resultado.parcelasCartao}x de ${formatarMoeda(orcamento.resultado.valorParcelaIndividual || 0)}`,
      191,
      posYTotais,
      { align: 'right' }
    );
  }

  // Destaque À Vista (Pix, Dinheiro ou Binance Pay)
  const pixBoxY = cardY + 36.5;
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(118, pixBoxY, 75, 14, 1.5, 1.5, 'F');
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(118, pixBoxY, 75, 14, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(5, 150, 105);
  doc.text(`À VISTA (Pix, Dinheiro ou Binance Pay): ${orcamento.resultado.descontoAVistaPercentual}% OFF`, 120.5, pixBoxY + 4.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(6, 95, 70);
  doc.text(formatarMoeda(orcamento.resultado.precoFinalAVistaTotal), 190, pixBoxY + 10.8, { align: 'right' });

  // Linhas de Assinatura (Apenas no Modo B: Termo de OS)
  if (modoHardware === 'termo_os') {
    const signY = cardY + 58;
    if (signY < 270) {
      doc.setDrawColor(148, 163, 184);
      doc.line(20, signY + 10, 90, signY + 10);
      doc.line(120, signY + 10, 190, signY + 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text('Assinatura do Técnico Responsável', 55, signY + 14, { align: 'center' });
      doc.text('Ciência do Cliente (Checklist e CDC)', 155, signY + 14, { align: 'center' });
    }
  }

  // Rodapé
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  if (modoHardware === 'orcamento') {
    doc.text('Documento gerado por PrintVal • Proposta Comercial de Serviços Especializados', 105, 287, { align: 'center' });
  } else {
    doc.text('Documento gerado por PrintVal • Termo de Entrada e Ordem de Serviço Técnico', 105, 287, { align: 'center' });
  }

  const prefixo = modoHardware === 'orcamento' ? 'Orcamento_OS' : 'Termo_OS';
  const nomeArquivo = `${prefixo}_${orcamento.numero}_${orcamento.clienteNome.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(nomeArquivo);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function gerarPDFImpressao3D(doc: any, autoTable: any, orcamento: Orcamento, config: ConfiguracoesGlobais): Promise<void> {
  const azulPrimario = [14, 165, 233]; // #0ea5e9
  const cinzaEscuro = [30, 41, 59]; // #1e293b
  const cinzaClaro = [241, 245, 249]; // #f1f5f9
  const verdeDestaque = [16, 185, 129]; // #10b981

  // 1. Barra Superior Decorativa
  doc.setFillColor(azulPrimario[0], azulPrimario[1], azulPrimario[2]);
  doc.rect(0, 0, 210, 8, 'F');

  // 2. Cabeçalho da Proposta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(cinzaEscuro[0], cinzaEscuro[1], cinzaEscuro[2]);
  doc.text(config.nomeEmpresa || 'OFICINA DE IMPRESSÃO 3D', 14, 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Manufatura Aditiva de Precisão • Prototipagem & Lotes Técnicos', 14, 27);
  if (config.telefoneEmpresa) {
    doc.text(`Contato: ${config.telefoneEmpresa}`, 14, 32);
  }

  // Bloco Direita: Número do Orçamento e Data
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(azulPrimario[0], azulPrimario[1], azulPrimario[2]);
  doc.text(`PROPOSTA COMERCIAL`, 196, 20, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(cinzaEscuro[0], cinzaEscuro[1], cinzaEscuro[2]);
  doc.text(`Nº: ${orcamento.numero}`, 196, 26, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Data: ${formatarData(orcamento.dataCriacao)}`, 196, 31, { align: 'right' });
  doc.text(`Validade: 10 dias corridos`, 196, 36, { align: 'right' });

  // Linha divisória suave
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(14, 40, 196, 40);

  // 3. Informações do Cliente & Projeto (Caixa estilizada)
  doc.setFillColor(cinzaClaro[0], cinzaClaro[1], cinzaClaro[2]);
  doc.roundedRect(14, 43, 182, 26, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(azulPrimario[0], azulPrimario[1], azulPrimario[2]);
  doc.text('DADOS DO CLIENTE & PROJETO', 18, 49);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(cinzaEscuro[0], cinzaEscuro[1], cinzaEscuro[2]);
  doc.text(`Cliente:`, 18, 56);
  doc.setFont('helvetica', 'normal');
  doc.text(orcamento.clienteNome || 'Cliente Não Informado', 34, 56);

  if (orcamento.clienteTelefone) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Telefone:`, 115, 56);
    doc.setFont('helvetica', 'normal');
    doc.text(orcamento.clienteTelefone, 132, 56);
  }

  doc.setFont('helvetica', 'bold');
  doc.text(`Projeto:`, 18, 63);
  doc.setFont('helvetica', 'normal');
  doc.text(orcamento.projetoNome || 'Projeto Sem Título', 34, 63);

  doc.setFont('helvetica', 'bold');
  doc.text(`Prazo de Produção:`, 115, 63);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(azulPrimario[0], azulPrimario[1], azulPrimario[2]);
  doc.text(orcamento.resultado.prazoFinalAdotado, 150, 63);

  // 4. Tabela de Discriminação de Serviços Transparentes
  const qtd = orcamento.item?.quantidadeLote || 1;
  const fil = orcamento.filamentoSnapshot;

  const valorMateriaPrimaVenda = orcamento.resultado.custoDiretoTotal > 0
    ? (orcamento.resultado.custoMateriaPrimaTotal / orcamento.resultado.custoDiretoTotal) * orcamento.resultado.precoFinalPadraoTotal
    : 0;
  const valorManufaturaVenda = orcamento.resultado.precoFinalPadraoTotal - valorMateriaPrimaVenda;

  let descricaoMateriaPrima = '';
  if (orcamento.resultado.detalhamentoMateriais && orcamento.resultado.detalhamentoMateriais.length > 1) {
    const listaMateriais = orcamento.resultado.detalhamentoMateriais
      .map(
        (m, idx) =>
          `• [${m.rotuloParte || `Parte ${idx + 1}`}] ${m.tipo} ${m.corNome} (${m.marca}): ${m.pesoTotalGramas}g`
      )
      .join('\n');
    descricaoMateriaPrima = `Matéria-Prima Técnica Especializada (Multicor / Multipieças)\n${listaMateriais}\n• Consumo Total Consolidado: ${orcamento.resultado.pesoTotalLoteGramas}g`;
  } else if (fil) {
    descricaoMateriaPrima = `Matéria-Prima Técnica Especializada\nMaterial: ${fil.tipo} (${fil.marca} - ${fil.nome})\nCor: ${fil.corNome} | Consumo Est.: ${orcamento.resultado.pesoTotalLoteGramas}g (${(orcamento.resultado.pesoTotalLoteGramas / qtd).toFixed(1)}g/peça)`;
  } else {
    descricaoMateriaPrima = `Matéria-Prima Técnica Especializada\nConsumo Est.: ${orcamento.resultado.pesoTotalLoteGramas}g`;
  }

  const bodyData = [
    [
      '1',
      descricaoMateriaPrima,
      `${qtd} un`,
      formatarMoeda(valorMateriaPrimaVenda / qtd),
      formatarMoeda(valorMateriaPrimaVenda),
    ],
    [
      '2',
      `Serviços de Manufatura Aditiva & Preparação Técnica\n• Setup de fatiamento de precisão e calibração de máquina\n• Tempo de máquina dedicado: ${orcamento.resultado.cargaHorariaTotal}h\n• Nível de acabamento: ${orcamento.resultado.complexidadeRotulo || 'Padrão'}\n• Controle de qualidade dimensional e inspeção final`,
      `${qtd} un`,
      formatarMoeda(valorManufaturaVenda / qtd),
      formatarMoeda(valorManufaturaVenda),
    ],
  ];

  if (orcamento.item?.insumosSecundarios && orcamento.item.insumosSecundarios.length > 0) {
    const listaNomes = orcamento.item.insumosSecundarios.map((i) => i.nome).join(', ');
    bodyData.push([
      '3',
      `Insumos Complementares e Embalagem Segura\nComponentes adicionais: ${listaNomes}`,
      '1 kit',
      formatarMoeda(orcamento.resultado.custoInsumosTotal * 1.3),
      formatarMoeda(orcamento.resultado.custoInsumosTotal * 1.3),
    ]);
  }

  autoTable(doc, {
    startY: 74,
    head: [['#', 'Descrição do Item / Serviço Especializado', 'Qtd', 'Unitário', 'Total']],
    body: bodyData,
    theme: 'grid',
    headStyles: {
      fillColor: [14, 165, 233],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 105 },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 24, halign: 'right' },
      4: { cellWidth: 25, halign: 'right' },
    },
    styles: {
      fontSize: 8.5,
      cellPadding: 4,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalY = (doc as any).lastAutoTable?.finalY || 150;
  const cardY = finalY + 8;

  // Bloco Esquerdo: Observações Técnicas & Condições
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, cardY, 95, 52, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, cardY, 95, 52, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(azulPrimario[0], azulPrimario[1], azulPrimario[2]);
  doc.text('CONDIÇÕES TÉCNICAS E COMERCIAIS', 18, cardY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text('• Produção iniciada após confirmação do pedido.', 18, cardY + 14);
  doc.text(`• Prazo comercial estimado: ${orcamento.resultado.prazoFinalAdotado}.`, 18, cardY + 19);
  doc.text('• Tolerância dimensional padrão FDM: +/- 0.2mm a 0.4mm.', 18, cardY + 24);
  doc.text('• Não submeter peças em PLA/PETG a calor excessivo (>55°C).', 18, cardY + 29);
  if (config.chavePix) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(cinzaEscuro[0], cinzaEscuro[1], cinzaEscuro[2]);
    doc.text(`Chave Pix: ${config.chavePix}`, 18, cardY + 37);
  }
  if (config.carteiraBinancePay) {
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Binance Pay ID: ${config.carteiraBinancePay}`, 18, cardY + 44);
  }

  // Bloco Direito: Totais Financeiros com Destaque para Pagamento à Vista
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(114, cardY, 82, 52, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(114, cardY, 82, 52, 2, 2, 'S');

  let posYTotais = cardY + 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Subtotal de Produção:', 118, posYTotais);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(cinzaEscuro[0], cinzaEscuro[1], cinzaEscuro[2]);
  doc.text(formatarMoeda(orcamento.resultado.precoSubtotalTotal), 190, posYTotais, { align: 'right' });

  if (orcamento.resultado.descontoLotePercentual > 0) {
    posYTotais += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(verdeDestaque[0], verdeDestaque[1], verdeDestaque[2]);
    doc.text(`Desconto Lote (${orcamento.resultado.descontoLotePercentual}%):`, 118, posYTotais);
    doc.text(`Incluso no lote`, 190, posYTotais, { align: 'right' });
  }

  if (orcamento.resultado.valorDescontoComercialTotal > 0) {
    posYTotais += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(verdeDestaque[0], verdeDestaque[1], verdeDestaque[2]);
    doc.text('Desconto Comercial:', 118, posYTotais);
    doc.text(`- ${formatarMoeda(orcamento.resultado.valorDescontoComercialTotal)}`, 190, posYTotais, { align: 'right' });
  }

  posYTotais += 7;
  doc.setDrawColor(203, 213, 225);
  doc.line(118, posYTotais - 1, 192, posYTotais - 1);

  // Preço Cartão
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Valor Cartão (Parcelado):', 118, posYTotais + 3);
  doc.text(formatarMoeda(orcamento.resultado.precoFinalPadraoTotal), 190, posYTotais + 3, { align: 'right' });

  // Destaque Especial: À Vista (Pix / Binance Pay / Dinheiro)
  const caixaDestaqueY = posYTotais + 7;
  doc.setFillColor(236, 253, 245);
  doc.roundedRect(118, caixaDestaqueY, 74, 18, 1.5, 1.5, 'F');
  doc.setDrawColor(16, 185, 129);
  doc.roundedRect(118, caixaDestaqueY, 74, 18, 1.5, 1.5, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(5, 150, 105);
  doc.text(`À VISTA (Pix, Dinheiro ou Binance Pay): ${orcamento.resultado.descontoAVistaPercentual}% OFF`, 120.5, caixaDestaqueY + 4.8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(6, 95, 70);
  doc.text(formatarMoeda(orcamento.resultado.precoFinalAVistaTotal), 190, caixaDestaqueY + 13, { align: 'right' });

  // 6. Rodapé Corporativo
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Documento gerado automaticamente por PrintVal 3D • Orçamento válido sem emendas', 105, 287, { align: 'center' });

  const nomeArquivo = `Orcamento_${orcamento.numero}_${orcamento.clienteNome.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  doc.save(nomeArquivo);
}

