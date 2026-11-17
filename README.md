# PrintVal 3D — Sistema de Precificação e Gestão

> **Versão 0.1.0 (Setup Inicial & Motor Financeiro)**

Sistema web desenvolvido para precificação técnica de projetos de **Impressão 3D**, com foco em cálculo real de custos (matéria-prima, energia elétrica, depreciação de máquina, setup e pós-processamento).

---

## 🛠️ Tecnologias Utilizadas Nesta Versão

- **[React 18](https://react.dev/):** Biblioteca para construção da interface reativa baseada em componentes.
- **[TypeScript](https://www.typescriptlang.org/):** Tipagem estática rigorosa para garantir segurança nos cálculos financeiros e estruturas de dados.
- **[Vite](https://vitejs.dev/):** Bundler moderno com *Hot Module Replacement (HMR)* ultrarrápido.
- **[Tailwind CSS](https://tailwindcss.com/):** Framework *utility-first* para estilização responsiva e suporte a tema escuro.

---

## ✅ O que foi implementado (v0.1.0)

- Setup completo do ambiente **Vite + React + TypeScript + Tailwind CSS**.
- Definição das interfaces e tipos centrais em `src/types/index.ts`.
- Criação do **Motor Financeiro** (`src/utils/pricingEngine.ts`) com cálculo de custo por grama, fator de qualidade/risco, consumo energético (kWh), depreciação horária e descontos progressivos por lote.
- Camada de persistência local em `localStorage` (`src/services/storageService.ts`) e dados iniciais de demonstração (`src/data/mockData.ts`).

---

## 🚀 Como rodar localmente

```bash
npm install
npm run dev
```
