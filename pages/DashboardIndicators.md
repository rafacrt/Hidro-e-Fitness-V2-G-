# Indicadores Dashboard (KPIs)
A tarefa solicitou a evolução da tela "Visão Geral" contendo KPIs (Dashboard.tsx) e um controle de exibição de relatórios.

### 1 - Banco de dados:
No back-end `server.js` em `/api/dashboard/kpis`, iremos buscar/calcular métricas adicionais.

| Label Original | Label Novo | Objetivo | Retorno |
|--|--|--|--|
| Total Alunos Ativos | *Inalterado* | Total alunos `status='Ativo'` | Número |
| Ocupação Média | *Inalterado* | Média de alunos por turma | Porcentagem |
| Receita Mensal | *Inalterado* | Receitas pagas no mês | Monetário |
| Aulas Hoje | *Inalterado* | Aulas no dia atual | Número |
| **Inadimplentes** (NEW) | Inadimplência | Transações vencidas e Pendente | Numero (Qtde) |
| **Aulas Canceladas** (NEW) | Cancelamentos | Turmas `status='Cancelled'` | Número |

### 2 - Front-end (`Dashboard.tsx`):
1. Modal (ou slide-out) de configuração que abra com `Personalizar Indicadores`
2. Estado `visibleKpis: string[]` com o nome/label dos indicadores ativos
3. Salvar esse array no `localStorage`, e `useEffect` buscando-o no reload da página
4. Ao mostrar os KPIs (na grid `.map()`), realizar um `.filter(k => visibleKpis.includes(k.label))`
5. Criar um layout de lista simples e bonita no modal, checando as Checkboxes.
