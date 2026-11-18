# PrintVal 3D — Sistema de Precificação e Gestão

> **Versão 0.2.0 (Navegação, Configurações Globais & Exportação PDF/WhatsApp)**

---

## 🛠️ Tecnologias Utilizadas

- **React 18** + **TypeScript** + **Vite** + **Tailwind CSS**
- **[Lucide React](https://lucide.dev/):** Biblioteca de ícones vetoriais modernos.
- **[jsPDF](https://github.com/parallax/jsPDF) & [jsPDF-AutoTable](https://github.com/simonbengtsson/jsPDF-AutoTable):** Geração de propostas comerciais em PDF diretamente no navegador.

---

## ✅ Novidades desta Versão (v0.2.0)

- **Barra de Navegação (`Navbar.tsx`):** Suporte a abas, alternância de Tema Claro/Escuro (*Dark Mode*) e menu responsivo.
- **Painel de Configurações (`ConfiguracoesModal.tsx`):** Ajuste de custo de kWh, potência da impressora, depreciação, taxas de setup, descontos à vista e dados da oficina (Pix/Binance Pay).
- **Gerador de Propostas PDF (`pdfGenerator.ts`):** Exportação de orçamentos comerciais profissionais com tabelas formatadas.
- **Compartilhamento WhatsApp (`whatsappShare.ts`):** Geração de resumo formatado pronto para envio ao cliente.

---

## 🚀 Como rodar localmente

```bash
npm install
npm run dev
```
