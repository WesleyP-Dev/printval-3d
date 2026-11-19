# PrintVal 3D — Sistema de Precificação e Gestão

> **Versão 0.3.0 (Gestão Completa de Estoque de Filamentos)**

---

## 🛠️ Tecnologias Utilizadas

- **React 18** + **TypeScript** + **Vite** + **Tailwind CSS**
- **Lucide React** (ícones) + **jsPDF / AutoTable** (exportação de propostas)

---

## ✅ Novidades desta Versão (v0.3.0)

- **Aba de Filamentos (`FilamentosTab.tsx`):**
  - Cadastro, edição e exclusão de bobinas (PLA, PETG, ABS, TPU, ASA, Resina).
  - Controle de peso total vs. saldo restante em gramas com barra de progresso visual.
  - Histórico de variação de preços por rolo e marcação de favoritos.
  - Filtros rápidos por tipo de material e busca por nome/cor.
- **Modal de Cadastro (`FilamentoModal.tsx`):** Seletor de cor hexadecimal e fator de risco/qualidade por material.

---

## 🚀 Como rodar localmente

```bash
npm install
npm run dev
```
