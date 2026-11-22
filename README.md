# PrintVal 3D — Sistema de Precificação e Gestão

> **Versão 0.6.0 (Análise Financeira & Ponto de Equilíbrio - Break-Even)**

---

## 🛠️ Tecnologias Utilizadas

- **React 18** + **TypeScript** + **Vite** + **Tailwind CSS**
- **[Recharts](https://recharts.org/):** Gráficos interativos para análise financeira e faturamento.
- **Lucide React** + **jsPDF / AutoTable**

---

## ✅ Novidades desta Versão (v0.6.0)

- **Dashboard de Ponto de Equilíbrio (`BreakEvenTab.tsx`):**
  - Cálculo automático de custos fixos mensais + amortização mensal da impressora.
  - Indicador de margem de contribuição média por hora faturada.
  - Meta de horas e quantidade de peças necessárias no mês para atingir o ponto de equilíbrio (*Break-Even*).
  - Gráficos comparativos de faturamento vs. lucro líquido estimado usando **Recharts**.
- **Otimização de Bundle:** Code-splitting configurado no `vite.config.ts` para separar chunks pesados (`vendor-recharts`, `vendor-icons`).

---

## 🚀 Como rodar localmente

```bash
npm install
npm run dev
```
