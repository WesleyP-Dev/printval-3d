# PrintVal 3D — Sistema de Precificação e Gestão

> **Versão 0.4.0 (Calculadora 3D Multi-Material Completa)**

---

## 🛠️ Tecnologias Utilizadas

- **React 18** + **TypeScript** + **Vite** + **Tailwind CSS**
- **Lucide React** + **jsPDF / AutoTable**

---

## ✅ Novidades desta Versão (v0.4.0)

- **Calculadora de Impressão 3D (`CalculadoraTab.tsx`):**
  - Suporte a **múltiplos materiais e cores** em uma mesma peça/projeto (ex: Corpo em PLA Preto + Detalhes em PETG Azul).
  - Verificação automática de saldo disponível no estoque do filamento.
  - Cálculo de tempo de máquina, energia elétrica, depreciação e setup fixo por lote.
  - Presets de complexidade de pós-processamento (Nenhum, Simples, Médio, Complexo ou Manual).
  - Insumos secundários (ímãs, parafusos, argolas, verniz) por unidade ou por lote.
  - Desconto comercial avulso e comparativo À Vista (Pix/Binance Pay) vs. Cartão.
  - Salvamento automático de rascunho no `localStorage` para não perder dados ao trocar de aba.

---

## 🚀 Como rodar localmente

```bash
npm install
npm run dev
```
