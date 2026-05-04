import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, DollarSign, AlertOctagon,
  Plus, Filter, ArrowUpRight, ArrowDownRight, Calendar,
  X, Printer, Edit, Trash2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { FinancialTransaction, TransactionType, TransactionCategory, TransactionStatus } from '../types';
import {
  fetchTransactions, createTransaction, updateTransaction, deleteTransaction,
  fetchStudents, fetchPlans
} from '../services/api';

// ── Label maps ────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  TUITION:      'Mensalidade',
  REGISTRATION: 'Matrícula',
  SALARY:       'Salário',
  MAINTENANCE:  'Manutenção',
  RENT:         'Aluguel',
  EQUIPMENT:    'Equipamento',
  OTHER:        'Outro',
};

const PAYMENT_LABELS: Record<string, string> = {
  DINHEIRO: '💵 Dinheiro',
  PIX:      '📱 Pix',
  DEBITO:   '💳 Débito',
  CREDITO:  '💳 Crédito',
  CHEQUE:   '📄 Cheque',
};

const PAYMENT_METHODS = [
  { id: 'DINHEIRO', label: 'Dinheiro', emoji: '💵' },
  { id: 'PIX',      label: 'Pix',      emoji: '📱' },
  { id: 'DEBITO',   label: 'Débito',   emoji: '💳' },
  { id: 'CREDITO',  label: 'Crédito',  emoji: '💳' },
  { id: 'CHEQUE',   label: 'Cheque',   emoji: '📄' },
];

type ActiveTab    = 'cashflow' | 'income' | 'expense';
type PeriodFilter = 'month' | 'prev_month' | 'year' | 'custom';

// ── Component ─────────────────────────────────────────────────────────────────

const Finance: React.FC = () => {
  const location    = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const studentFilter = searchParams.get('student');

  const [transactions,      setTransactions]      = useState<FinancialTransaction[]>([]);
  const [students,          setStudents]          = useState<any[]>([]);
  const [plans,             setPlans]             = useState<any[]>([]);
  const [loading,           setLoading]           = useState(true);

  const [activeTab,         setActiveTab]         = useState<ActiveTab>('cashflow');
  const [periodFilter,      setPeriodFilter]      = useState<PeriodFilter>('month');
  const [customStartDate,   setCustomStartDate]   = useState('');
  const [customEndDate,     setCustomEndDate]     = useState('');
  const [projectionDays,    setProjectionDays]    = useState(30);

  const [showModal,         setShowModal]         = useState(false);
  const [editingTx,         setEditingTx]         = useState<FinancialTransaction | null>(null);
  const [openActionMenu,    setOpenActionMenu]    = useState<string | null>(null);

  const [txForm, setTxForm] = useState<{
    id?: string;
    type: TransactionType;
    description: string;
    amount: string;
    category: TransactionCategory;
    relatedEntity: string;
    dueDate: string;
    status: TransactionStatus;
    paymentMethod: string;
  }>({
    type:          'INCOME',
    description:   '',
    amount:        '',
    category:      'TUITION',
    relatedEntity: '',
    dueDate:       new Date().toISOString().split('T')[0],
    status:        'PAID',
    paymentMethod: '',
  });

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setTransactions(await fetchTransactions());
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadAux = async () => {
    try {
      const [s, p] = await Promise.all([fetchStudents(), fetchPlans()]);
      setStudents(s);
      setPlans(p);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    loadTransactions();
    loadAux();
    if (studentFilter) {
      setActiveTab('income');
      setPeriodFilter('year');
    }
  }, [studentFilter]);

  // ── Period helpers ──────────────────────────────────────────────────────────

  const getFilterDates = () => {
    const now = new Date();
    switch (periodFilter) {
      case 'month':
        return { startDate: new Date(now.getFullYear(), now.getMonth(), 1),
                 endDate:   new Date(now.getFullYear(), now.getMonth() + 1, 0) };
      case 'prev_month': {
        const pm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return { startDate: pm,
                 endDate:   new Date(now.getFullYear(), now.getMonth(), 0) };
      }
      case 'year':
        return { startDate: new Date(now.getFullYear(), 0, 1),
                 endDate:   new Date(now.getFullYear(), 11, 31) };
      case 'custom':
        return {
          startDate: customStartDate ? new Date(customStartDate) : new Date(now.getFullYear(), now.getMonth(), 1),
          endDate:   customEndDate   ? new Date(customEndDate)   : now,
        };
    }
  };

  const periodLabel = (): string => {
    const now = new Date();
    switch (periodFilter) {
      case 'month':      return now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      case 'prev_month': return new Date(now.getFullYear(), now.getMonth() - 1, 1)
                                .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      case 'year':       return `Ano ${now.getFullYear()}`;
      case 'custom':
        if (customStartDate && customEndDate)
          return `${new Date(customStartDate + 'T12:00:00').toLocaleDateString('pt-BR')} – ${new Date(customEndDate + 'T12:00:00').toLocaleDateString('pt-BR')}`;
        return 'Personalizado';
    }
  };

  // ── Derived data ────────────────────────────────────────────────────────────

  const testStudentNames = useMemo(
    () => new Set(students.filter(s => s.isTest).map(s => s.name.toLowerCase())),
    [students]
  );

  const filteredTransactions = useMemo(() => {
    const { startDate, endDate } = getFilterDates()!;

    return transactions.filter(t => {
      // Exclude test-student transactions from all financial views
      if (t.relatedEntity && testStudentNames.has(t.relatedEntity.toLowerCase())) return false;

      let d: Date;
      if (t.date.includes('T')) d = new Date(t.date);
      else { const [y, m, day] = t.date.split('-').map(Number); d = new Date(y, m - 1, day); }
      d.setHours(0, 0, 0, 0);

      const start = new Date(startDate); start.setHours(0, 0, 0, 0);
      const end   = new Date(endDate);   end.setHours(23, 59, 59, 999);

      if (studentFilter) {
        return t.relatedEntity?.toLowerCase().includes(studentFilter.toLowerCase())
          || t.description.toLowerCase().includes(studentFilter.toLowerCase());
      }
      return d >= start && d <= end;
    });
  }, [transactions, students, periodFilter, customStartDate, customEndDate, studentFilter]);

  const stats = useMemo(() => {
    const totalIncome   = filteredTransactions.filter(t => t.type === 'INCOME'  && t.status === 'PAID').reduce((s, t) => s + Number(t.amount), 0);
    const totalExpense  = filteredTransactions.filter(t => t.type === 'EXPENSE' && t.status === 'PAID').reduce((s, t) => s + Number(t.amount), 0);
    const netProfit     = totalIncome - totalExpense;
    const expected      = filteredTransactions.filter(t => t.type === 'INCOME'  && t.status !== 'CANCELLED').reduce((s, t) => s + Number(t.amount), 0);
    const late          = filteredTransactions.filter(t => t.type === 'INCOME'  && t.status === 'LATE').reduce((s, t) => s + Number(t.amount), 0);
    const defaultRate   = expected > 0 ? (late / expected) * 100 : 0;
    return { totalIncome, totalExpense, netProfit, defaultRate };
  }, [filteredTransactions]);

  const projection = useMemo(() => {
    if (!transactions.length) return { income: 0, expense: 0, balance: 0 };
    const now   = new Date();
    const start = new Date(now.getTime() - 90 * 86400000);
    start.setHours(0, 0, 0, 0);
    const hist = transactions.filter(t => {
      if (t.relatedEntity && testStudentNames.has(t.relatedEntity.toLowerCase())) return false;
      let d: Date;
      if (t.date.includes('T')) d = new Date(t.date);
      else { const [y, m, day] = t.date.split('-').map(Number); d = new Date(y, m - 1, day); }
      return d >= start && d <= now && t.status === 'PAID';
    });
    const i90 = hist.filter(t => t.type === 'INCOME') .reduce((s, t) => s + Number(t.amount), 0);
    const e90 = hist.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);
    return { income: (i90 / 90) * projectionDays, expense: (e90 / 90) * projectionDays, balance: ((i90 - e90) / 90) * projectionDays };
  }, [transactions, projectionDays]);

  const chartData = useMemo(() => {
    const grouped: Record<string, { date: string; income: number; expense: number }> = {};
    filteredTransactions.forEach(t => {
      let date: string;
      if (t.date.includes('T')) date = new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      else { const [, m, d] = t.date.split('-'); date = `${d}/${m}`; }
      if (!grouped[date]) grouped[date] = { date, income: 0, expense: 0 };
      if (t.type === 'INCOME'  && t.status === 'PAID') grouped[date].income  += Number(t.amount);
      if (t.type === 'EXPENSE' && t.status === 'PAID') grouped[date].expense += Number(t.amount);
    });
    return Object.values(grouped).sort((a, b) => {
      const [da, ma] = a.date.split('/');
      const [db, mb] = b.date.split('/');
      return new Date(2024, +ma - 1, +da).getTime() - new Date(2024, +mb - 1, +db).getTime();
    });
  }, [filteredTransactions]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const openNewModal = () => {
    setEditingTx(null);
    setTxForm({
      type:          activeTab === 'expense' ? 'EXPENSE' : 'INCOME',
      description:   '',
      amount:        '',
      category:      activeTab === 'expense' ? 'MAINTENANCE' : 'TUITION',
      relatedEntity: '',
      dueDate:       new Date().toISOString().split('T')[0],
      status:        'PAID',
      paymentMethod: '',
    });
    setShowModal(true);
  };

  const openEditModal = (t: FinancialTransaction, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTx(t);
    setTxForm({
      id:            t.id,
      type:          t.type,
      description:   t.description,
      amount:        t.amount.toString(),
      category:      t.category,
      relatedEntity: t.relatedEntity || '',
      dueDate:       t.dueDate.split('T')[0],
      status:        t.status,
      paymentMethod: (t as any).paymentMethod || '',
    });
    setShowModal(true);
    setOpenActionMenu(null);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Excluir esta transação?')) return;
    try { await deleteTransaction(id); await loadTransactions(); }
    catch { alert('Erro ao excluir.'); }
    setOpenActionMenu(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const tx: FinancialTransaction = {
      id:            editingTx ? editingTx.id : crypto.randomUUID(),
      description:   txForm.description,
      type:          txForm.type,
      category:      txForm.category,
      amount:        parseFloat(txForm.amount),
      date:          editingTx ? editingTx.date : new Date().toISOString().split('T')[0],
      dueDate:       txForm.dueDate,
      status:        txForm.status,
      relatedEntity: txForm.relatedEntity,
      paymentMethod: (txForm.paymentMethod as any) || undefined,
    };
    try {
      editingTx ? await updateTransaction(tx.id, tx) : await createTransaction(tx);
      await loadTransactions();
      setShowModal(false);
    } catch { alert('Erro ao salvar transação.'); }
  };

  // ── Sub-components ───────────────────────────────────────────────────────────

  const fmtMoney = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  const StatusBadge = ({ status }: { status: string }) => {
    const cfg: Record<string, [string, string]> = {
      PAID:      ['bg-green-100 text-green-700',  'Pago'],
      PENDING:   ['bg-yellow-100 text-yellow-700','Pendente'],
      LATE:      ['bg-red-100 text-red-700',      'Atrasado'],
      CANCELLED: ['bg-slate-100 text-slate-500',  'Cancelado'],
    };
    const [cls, label] = cfg[status] ?? cfg.CANCELLED;
    return <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${cls}`}>{label}</span>;
  };

  const [tableSearch, setTableSearch] = React.useState('');
  const [sortCol, setSortCol]   = React.useState<string>('dueDate');
  const [sortDir, setSortDir]   = React.useState<'asc' | 'desc'>('desc');

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  /** Parses any date value from the API (Date object, ISO string, YYYY-MM-DD string) safely. */
  const parseApiDate = (d: any): Date | null => {
    if (!d) return null;
    if (d instanceof Date) return isNaN(d.getTime()) ? null : d;
    const s = String(d);
    const parsed = (s.includes('T') || s.includes('Z')) ? new Date(s) : new Date(s + 'T12:00:00');
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const fmtApiDate = (d: any) => {
    const p = parseApiDate(d);
    return p ? p.toLocaleDateString('pt-BR') : '—';
  };

  const STATUS_ORDER: Record<string, number> = { LATE: 0, PENDING: 1, PAID: 2, CANCELLED: 3 };

  const renderTable = (type: TransactionType) => {
    const isIncome = type === 'INCOME';
    const allRows = filteredTransactions.filter(t => t.type === type);
    const searched = tableSearch.trim()
      ? allRows.filter(t =>
          t.description.toLowerCase().includes(tableSearch.toLowerCase()) ||
          (t.relatedEntity ?? '').toLowerCase().includes(tableSearch.toLowerCase())
        )
      : allRows;

    const rows = [...searched].sort((a, b) => {
      let av: any, bv: any;
      switch (sortCol) {
        case 'description': av = a.description; bv = b.description; break;
        case 'category':    av = CATEGORY_LABELS[a.category] || a.category; bv = CATEGORY_LABELS[b.category] || b.category; break;
        case 'payment':     av = (a as any).paymentMethod || ''; bv = (b as any).paymentMethod || ''; break;
        case 'dueDate':     av = parseApiDate(a.dueDate || a.date)?.getTime() ?? 0; bv = parseApiDate(b.dueDate || b.date)?.getTime() ?? 0; break;
        case 'status':      av = STATUS_ORDER[a.status] ?? 9; bv = STATUS_ORDER[b.status] ?? 9; break;
        case 'amount':      av = Number(a.amount); bv = Number(b.amount); break;
        default:            av = 0; bv = 0;
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    const totalPaid = rows.filter(t => t.status === 'PAID').reduce((s, t) => s + Number(t.amount), 0);

    const SortIcon = ({ col }: { col: string }) => (
      <span className="ml-1 inline-block text-slate-400">
        {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
      </span>
    );

    const thCls = "px-5 py-3 text-xs font-semibold text-slate-500 uppercase cursor-pointer select-none hover:text-slate-700 hover:bg-slate-100 transition-colors";

    return (
      <div className="space-y-3">
        {/* Search bar */}
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          <input
            type="text"
            value={tableSearch}
            onChange={e => setTableSearch(e.target.value)}
            placeholder="Buscar por aluno ou descrição..."
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white"
          />
          {tableSearch && (
            <button onClick={() => setTableSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        {rows.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-14 text-center text-slate-400">
            <DollarSign size={40} className="mx-auto mb-3 text-slate-200" />
            <p className="text-sm">{tableSearch ? 'Nenhum resultado para a busca.' : `Nenhuma ${isIncome ? 'entrada' : 'saída'} no período selecionado.`}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className={thCls} onClick={() => toggleSort('description')}>Descrição<SortIcon col="description" /></th>
                    <th className={thCls} onClick={() => toggleSort('category')}>Categoria<SortIcon col="category" /></th>
                    <th className={thCls} onClick={() => toggleSort('payment')}>Pagamento<SortIcon col="payment" /></th>
                    <th className={thCls} onClick={() => toggleSort('dueDate')}>Vencimento<SortIcon col="dueDate" /></th>
                    <th className={thCls} onClick={() => toggleSort('status')}>Status<SortIcon col="status" /></th>
                    <th className={`${thCls} text-right`} onClick={() => toggleSort('amount')}>Valor<SortIcon col="amount" /></th>
                    <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="font-medium text-slate-800 text-sm">{t.description}</div>
                        {t.relatedEntity && <div className="text-xs text-slate-400 mt-0.5">{t.relatedEntity}</div>}
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 font-medium">
                          {CATEGORY_LABELS[t.category] || t.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-slate-500">
                        {(t as any).paymentMethod ? (PAYMENT_LABELS[(t as any).paymentMethod] || (t as any).paymentMethod) : '—'}
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-500">
                        {fmtApiDate(t.dueDate || t.date)}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`font-semibold text-sm ${isIncome ? 'text-green-700' : 'text-red-700'}`}>
                          {fmtMoney(Number(t.amount))}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={ev => openEditModal(t, ev)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit size={15} />
                          </button>
                          <button
                            onClick={ev => handleDelete(t.id, ev)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir transação"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t border-slate-200">
                    <td colSpan={5} className="px-5 py-3 text-sm font-bold text-slate-600">
                      Total pago ({rows.filter(r => r.status === 'PAID').length} de {rows.length} lançamentos)
                    </td>
                    <td className={`px-5 py-3 text-right font-bold text-sm ${isIncome ? 'text-green-700' : 'text-red-700'}`}>
                      {fmtMoney(totalPaid)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6" onClick={() => setOpenActionMenu(null)}>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Financeiro</h2>
          <p className="text-slate-500 text-sm">Visão gerencial de receitas, despesas e projeções</p>
          {studentFilter && (
            <div className="mt-2 inline-flex items-center gap-2 bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-sm">
              <Filter size={13} />
              Filtrando por: <strong>{studentFilter}</strong>
              <button onClick={() => window.history.back()} className="ml-1 hover:bg-primary-100 rounded-full p-0.5">
                <X size={13} />
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <button onClick={() => window.print()} className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white" title="Imprimir">
            <Printer size={18} />
          </button>
          <button
            onClick={openNewModal}
            className="px-4 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 flex items-center gap-2 shadow-lg shadow-primary-200 text-sm"
          >
            <Plus size={16} /> Nova Transação
          </button>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
        <Calendar size={15} className="text-slate-400" />
        <span className="text-sm font-medium text-slate-500 mr-1">Período:</span>
        {([
          { id: 'month',      label: 'Este Mês' },
          { id: 'prev_month', label: 'Mês Anterior' },
          { id: 'year',       label: 'Este Ano' },
          { id: 'custom',     label: 'Personalizado' },
        ] as { id: PeriodFilter; label: string }[]).map(p => (
          <button
            key={p.id}
            onClick={() => setPeriodFilter(p.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              periodFilter === p.id ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {p.label}
          </button>
        ))}
        {periodFilter === 'custom' && (
          <div className="flex items-center gap-2 ml-1">
            <input type="date" value={customStartDate} onChange={e => setCustomStartDate(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1 text-sm" />
            <span className="text-slate-400 text-sm">até</span>
            <input type="date" value={customEndDate} onChange={e => setCustomEndDate(e.target.value)}
              className="border border-slate-200 rounded-lg px-2 py-1 text-sm" />
          </div>
        )}
        <span className="ml-auto text-sm text-slate-400 font-medium capitalize">{periodLabel()}</span>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Receitas Recebidas</p>
            <TrendingUp size={18} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{fmtMoney(stats.totalIncome)}</p>
          <p className="text-xs text-slate-400 mt-1">Apenas pagamentos confirmados</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Despesas Pagas</p>
            <TrendingDown size={18} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold text-slate-800">{fmtMoney(stats.totalExpense)}</p>
          <p className="text-xs text-slate-400 mt-1">Custos efetivados no período</p>
        </div>

        <div className={`bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 ${stats.netProfit >= 0 ? 'border-l-blue-500' : 'border-l-orange-500'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Resultado Líquido</p>
            <DollarSign size={18} className={stats.netProfit >= 0 ? 'text-blue-500' : 'text-orange-500'} />
          </div>
          <p className={`text-2xl font-bold ${stats.netProfit >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>{fmtMoney(stats.netProfit)}</p>
          <p className="text-xs text-slate-400 mt-1">Receitas − Despesas (pagas)</p>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 border-l-4 border-l-orange-400">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-500">Inadimplência</p>
            <AlertOctagon size={18} className="text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-orange-600">{stats.defaultRate.toFixed(1)}%</p>
          <p className="text-xs text-slate-400 mt-1">Sobre receitas esperadas</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {([
          { id: 'cashflow', label: '📊 Visão Geral' },
          { id: 'income',   label: '⬆️ Entradas' },
          { id: 'expense',  label: '⬇️ Saídas' },
        ] as { id: ActiveTab; label: string }[]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? tab.id === 'income'  ? 'border-green-600 text-green-700'
                : tab.id === 'expense' ? 'border-red-600 text-red-700'
                                       : 'border-primary-600 text-primary-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Visão Geral ───────────────────────────────────────────────────────── */}
      {activeTab === 'cashflow' && (
        <div className="space-y-6">
          {/* Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200" style={{ height: 300 }}>
            <h3 className="text-sm font-bold text-slate-700 mb-4 capitalize">
              Evolução Financeira — {periodLabel()}
            </h3>
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-52 text-slate-300">
                <p className="text-sm">Sem movimentações no período.</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 11 }} tickFormatter={v => `R$${v}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
                    formatter={(v: number) => [`R$ ${v.toFixed(2).replace('.', ',')}`, '']}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="income"  name="Entradas" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Saídas"   fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Projection */}
          <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
              <div>
                <h3 className="font-bold text-lg">Projeção de Caixa</h3>
                <p className="text-slate-400 text-sm">Estimativa baseada nos últimos 90 dias</p>
              </div>
              <select
                value={projectionDays}
                onChange={e => setProjectionDays(Number(e.target.value))}
                className="bg-slate-800 border border-slate-700 text-white rounded-lg text-sm px-3 py-1.5"
              >
                <option value={30}>Próximos 30 dias</option>
                <option value={60}>Próximos 60 dias</option>
                <option value={90}>Próximos 90 dias</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <p className="text-slate-400 text-xs uppercase font-bold mb-1">Entradas Proj.</p>
                <p className="text-2xl font-bold text-green-400">{fmtMoney(projection.income)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase font-bold mb-1">Saídas Proj.</p>
                <p className="text-2xl font-bold text-red-400">{fmtMoney(projection.expense)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase font-bold mb-1">Saldo Proj.</p>
                <p className={`text-2xl font-bold ${projection.balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                  {fmtMoney(projection.balance)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'income'  && renderTable('INCOME')}
      {activeTab === 'expense' && renderTable('EXPENSE')}

      {/* ── Transaction Modal ──────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-slate-800">
                {editingTx ? 'Editar Transação' : 'Nova Transação'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1 text-slate-400 hover:text-red-500">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSave} className="px-6 py-5 space-y-4">

              {/* Type toggle */}
              <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
                <button type="button"
                  onClick={() => setTxForm({ ...txForm, type: 'INCOME', category: 'TUITION' })}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${txForm.type === 'INCOME' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <ArrowUpRight size={15} /> Entrada
                </button>
                <button type="button"
                  onClick={() => setTxForm({ ...txForm, type: 'EXPENSE', category: 'MAINTENANCE' })}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-1.5 ${txForm.type === 'EXPENSE' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <ArrowDownRight size={15} /> Saída
                </button>
              </div>

              {/* Student selector for tuition */}
              {txForm.type === 'INCOME' && txForm.category === 'TUITION' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Aluno</label>
                  <select
                    value={students.find(s => s.name === txForm.relatedEntity)?.id || ''}
                    onChange={e => {
                      const student = students.find(s => s.id === parseInt(e.target.value));
                      if (student) {
                        const plan = plans.find(p => p.name === student.plan);
                        setTxForm({ ...txForm, relatedEntity: student.name, description: `Mensalidade - ${student.name}`, amount: plan ? plan.price.toString() : txForm.amount });
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                  >
                    <option value="">Selecione um aluno</option>
                    {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Entidade Relacionada</label>
                  <input
                    value={txForm.relatedEntity}
                    onChange={e => setTxForm({ ...txForm, relatedEntity: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="Nome do aluno ou fornecedor"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <input
                  required
                  value={txForm.description}
                  onChange={e => setTxForm({ ...txForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Ex: Mensalidade Março 2026"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                  <input
                    required type="number" step="0.01" min="0"
                    value={txForm.amount}
                    onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vencimento</label>
                  <input
                    required type="date"
                    value={txForm.dueDate}
                    onChange={e => setTxForm({ ...txForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                  <select
                    value={txForm.category}
                    onChange={e => setTxForm({ ...txForm, category: e.target.value as TransactionCategory })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                  >
                    {txForm.type === 'INCOME' ? (
                      <>
                        <option value="TUITION">Mensalidade</option>
                        <option value="REGISTRATION">Matrícula</option>
                        <option value="OTHER">Outro</option>
                      </>
                    ) : (
                      <>
                        <option value="SALARY">Salário</option>
                        <option value="MAINTENANCE">Manutenção</option>
                        <option value="RENT">Aluguel</option>
                        <option value="EQUIPMENT">Equipamento</option>
                        <option value="OTHER">Outro</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={txForm.status}
                    onChange={e => setTxForm({ ...txForm, status: e.target.value as TransactionStatus })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                  >
                    <option value="PAID">Pago</option>
                    <option value="PENDING">Pendente</option>
                    <option value="LATE">Atrasado</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Payment method — optional */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Forma de Pagamento <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map(pm => (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setTxForm({ ...txForm, paymentMethod: txForm.paymentMethod === pm.id ? '' : pm.id })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
                        txForm.paymentMethod === pm.id
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-slate-200 hover:border-primary-300 text-slate-600'
                      }`}
                    >
                      <span>{pm.emoji}</span> {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)}
                  className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 shadow-md text-sm transition-colors">
                  {editingTx ? 'Salvar Alterações' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Finance;
