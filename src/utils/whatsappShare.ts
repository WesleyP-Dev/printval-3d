import { Orcamento, ConfiguracoesGlobais } from '../types';
import { formatarMoeda } from './pdfGenerator';

export function gerarTextoWhatsApp(orcamento: Orcamento, config: ConfiguracoesGlobais): string {
  const res = orcamento.resultado;

  if (orcamento.categoria === 'manutencao_hardware') {
    const hw = orcamento.hardwareItem;
    let texto = `*Olá, ${orcamento.clienteNome || 'Cliente'}!* 👋\n\n`;
    texto += `Segue o laudo e orçamento da sua Ordem de Serviço de Bancada:\n\n`;
    texto += `📌 *Ordem de Serviço:* \`${orcamento.numero}\`\n`;
    texto += `💻 *Equipamento:* *${hw?.marca || ''} ${hw?.modelo || 'Computador'}*\n`;
    if (hw?.numeroSerie) {
      texto += `🏷️ *Nº de Série:* \`${hw.numeroSerie}\`\n`;
    }
    if (hw?.sintomasRelatados) {
      texto += `🔍 *Queixa / Sintomas:* ${hw.sintomasRelatados}\n`;
    }

    if (hw?.servicosIds && hw.servicosIds.length > 0) {
      texto += `🛠️ *Serviços Técnicos:* ${hw.servicosIds.length} serviço(s) especializado(s)\n`;
    }
    if (hw?.pecas && hw.pecas.length > 0) {
      texto += `⚙️ *Peças / Upgrades:* ${hw.pecas.map((p) => p.descricao).join(', ')}\n`;
    }

    texto += `⏱️ *Prazo de Liberação:* *${res.prazoFinalAdotado}*\n`;
    texto += `🛡️ *Garantia:* *90 Dias conforme Art. 26 do CDC*\n\n`;

    texto += `💳 *CONDIÇÕES DE PAGAMENTO:*\n`;
    texto += `• *Valor Padrão (Cartão / Parcelado):* ${formatarMoeda(res.precoFinalPadraoTotal)}\n`;
    texto += `🔥 *Valor À VISTA (${res.descontoAVistaPercentual}% OFF no Pix):*\n`;
    texto += `👉 *${formatarMoeda(res.precoFinalAVistaTotal)}*\n\n`;

    if (config.chavePix) {
      texto += `🔑 *Chave Pix:* \`${config.chavePix}\`\n`;
    }

    texto += `\nPara autorizar a execução do serviço ou tirar dúvidas, basta responder a esta mensagem!\n`;
    texto += `_${config.nomeEmpresa || 'Assistência Técnica Especializada'}_`;
    return texto;
  }

  // Modo Impressão 3D
  const fil = orcamento.filamentoSnapshot;
  const qtd = orcamento.item?.quantidadeLote || 1;

  let texto = `*Olá, ${orcamento.clienteNome || 'Cliente'}!* 👋\n\n`;
  texto += `Segue a proposta comercial para o seu projeto de Impressão 3D:\n\n`;
  texto += `📌 *Proposta:* \`${orcamento.numero}\`\n`;
  texto += `🛠️ *Projeto:* *${orcamento.projetoNome}*\n`;
  if (orcamento.descricao) {
    texto += `📝 *Detalhes:* ${orcamento.descricao}\n`;
  }
  texto += `📦 *Quantidade:* ${qtd} unidade${qtd > 1 ? 's' : ''}\n`;
  if (res.detalhamentoMateriais && res.detalhamentoMateriais.length > 1) {
    const matsTexto = res.detalhamentoMateriais
      .map((m) => `  • ${m.rotuloParte || m.corNome}: ${m.tipo} (${m.pesoTotalGramas}g)`)
      .join('\n');
    texto += `🎨 *Materiais & Cores (${res.detalhamentoMateriais.length} partes):*\n${matsTexto}\n`;
    texto += `⚖️ *Peso Consolidado:* ${res.pesoTotalLoteGramas}g\n`;
  } else if (fil) {
    texto += `🧵 *Material:* ${fil.tipo} (${fil.marca} - ${fil.corNome})\n`;
    texto += `⚖️ *Peso Estimado:* ${res.pesoTotalLoteGramas}g\n`;
  } else {
    texto += `⚖️ *Peso Estimado:* ${res.pesoTotalLoteGramas}g\n`;
  }
  texto += `⏱️ *Prazo de Produção:* *${res.prazoFinalAdotado}*\n\n`;

  texto += `💳 *CONDIÇÕES FINANCEIRAS:*\n`;
  texto += `• *Valor Padrão (Cartão/Parcelado):* ${formatarMoeda(res.precoFinalPadraoTotal)}`;
  if (qtd > 1) {
    texto += ` (${formatarMoeda(res.precoFinalPadraoUnitario)}/un)`;
  }
  texto += `\n`;

  texto += `🔥 *Valor Especial À VISTA (${res.descontoAVistaPercentual}% OFF no Pix/Dinheiro/Binance):*\n`;
  texto += `👉 *${formatarMoeda(res.precoFinalAVistaTotal)}*`;
  if (qtd > 1) {
    texto += ` (${formatarMoeda(res.precoFinalAVistaUnitario)}/un)`;
  }
  texto += `\n\n`;

  if (config.chavePix) {
    texto += `🔑 *Chave Pix:* \`${config.chavePix}\`\n`;
  }
  if (config.carteiraBinancePay) {
    texto += `🌐 *Binance Pay:* \`${config.carteiraBinancePay}\`\n`;
  }

  texto += `\nCaso queira aprovar o pedido para iniciarmos a produção, basta responder a esta mensagem!\n`;
  texto += `_${config.nomeEmpresa || 'Oficina 3D'}_`;

  return texto;
}

export function copiarTextoParaAreaDeTransferencia(texto: string): Promise<boolean> {
  return navigator.clipboard.writeText(texto)
    .then(() => true)
    .catch((err) => {
      console.error('Falha ao copiar para área de transferência:', err);
      return false;
    });
}

export function abrirLinkWhatsApp(telefone: string | undefined, texto: string) {
  const telLimpo = telefone ? telefone.replace(/\D/g, '') : '';
  const url = telLimpo
    ? `https://wa.me/55${telLimpo}?text=${encodeURIComponent(texto)}`
    : `https://wa.me/?text=${encodeURIComponent(texto)}`;
  window.open(url, '_blank');
}
