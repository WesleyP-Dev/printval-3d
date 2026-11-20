# PrintVal 3D — Sistema de Precificação e Gestão

> **Versão 0.5.0 (Histórico de Pedidos, Controle de Status & Clonagem)**

---

## 🛠️ Tecnologias Utilizadas

- **React 18** + **TypeScript** + **Vite** + **Tailwind CSS**
- **Lucide React** + **jsPDF / AutoTable**

---

## ✅ Novidades desta Versão (v0.5.0)

- **Histórico de Orçamentos (`HistoricoTab.tsx`):**
  - Listagem completa de pedidos com busca por cliente, número ou projeto.
  - Filtros de status (*Pendente*, *Aprovado*, *Entregue*, *Cancelado*).
  - Baixa automática de estoque de filamento ao aprovar um pedido.
  - Clonagem de orçamentos antigos diretamente para a calculadora para reprecificação rápida.
- **Modal de Detalhes (`OrcamentoDetalhesModal.tsx`):** Visualização completa dos custos, materiais e opções de exportação em PDF ou WhatsApp.

---

## 🚀 Como rodar localmente

```bash
npm install
npm run dev
```
