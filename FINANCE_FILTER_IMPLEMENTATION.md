# Implementação de Filtro de Período no Finance.tsx

## 1. Adicionar Estado para o Filtro (após os outros estados, linha ~30)

```typescript
const [periodFilter, setPeriodFilter] = useState<'7days' | '30days' | 'month' | 'year' | 'custom'>('month');
const [customStartDate, setCustomStartDate] = useState('');
const [customEndDate, setCustomEndDate] = useState('');
```

## 2. Função para Calcular Datas do Filtro

```typescript
const getFilterDates = () => {
  const now = new Date();
  let startDate, endDate;

  switch (periodFilter) {
    case '7days':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      endDate = now;
      break;
    case '30days':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      endDate = now;
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31);
      break;
    case 'custom':
      startDate = customStartDate ? new Date(customStartDate) : new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = customEndDate ? new Date(customEndDate) : now;
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }

  return { startDate, endDate };
};
```

## 3. Filtrar Transações Baseado no Período

```typescript
const filteredTransactions = useMemo(() => {
  const { startDate, endDate } = getFilterDates();
  
  return transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= startDate && transactionDate <= endDate;
  });
}, [transactions, periodFilter, customStartDate, customEndDate]);
```

## 4. Recalcular KPIs com Transações Filtradas

```typescript
const revenue = filteredTransactions
  .filter(t => t.type === 'Receita')
  .reduce((sum, t) => sum + t.amount, 0);

const expense = filteredTransactions
  .filter(t => t.type === 'Despesa')
  .reduce((sum, t) => sum + t.amount, 0);

const netProfit = revenue - expense;

const overdue = filteredTransactions
  .filter(t => t.status === 'Pendente' && new Date(t.dueDate) < new Date())
  .reduce((sum, t) => sum + t.amount, 0);
```

## 5. Componente de Filtro (adicionar antes dos cards, após o título)

```typescript
<div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
  <div className="flex flex-wrap gap-4 items-end">
    <div className="flex-1 min-w-[200px]">
      <label className="block text-sm font-medium text-slate-700 mb-2">Período</label>
      <select
        value={periodFilter}
        onChange={(e) => setPeriodFilter(e.target.value as any)}
        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
      >
        <option value="7days">Últimos 7 dias</option>
        <option value="30days">Últimos 30 dias</option>
        <option value="month">Mês Atual</option>
        <option value="year">Ano Atual</option>
        <option value="custom">Período Personalizado</option>
      </select>
    </div>

    {periodFilter === 'custom' && (
      <>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-slate-700 mb-2">Data Início</label>
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-slate-700 mb-2">Data Fim</label>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"
          />
        </div>
      </>
    )}
  </div>
</div>
```

## 6. Atualizar a tabela para usar filteredTransactions

Trocar `transactions.map(...)` por `filteredTransactions.map(...)`

## Notas:
- Os cálculos dos cards serão atualizados automaticamente com base no período selecionado
- O padrão é "Mês Atual"
- Para período personalizado, ambas as datas são necessárias
- A tabela mostrará apenas as transações do período selecionado
