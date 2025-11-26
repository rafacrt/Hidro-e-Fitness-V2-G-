import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertOctagon,
  Plus,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  MoreVertical,
  X,
  Check,
  ChevronDown,
  Printer,
  Edit,
  Trash2,
  FileText
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { FinancialTransaction, TransactionType, TransactionCategory, TransactionStatus } from '../types';
import { fetchTransactions, createTransaction, updateTransaction, deleteTransaction } from '../services/api';

const Finance = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const studentFilter = searchParams.get('student');

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'income' | 'expense' | 'cashflow'>('cashflow');
  const [showModal, setShowModal] = useState(false);
  const [viewTransaction, setViewTransaction] = useState<FinancialTransaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [projectionDays, setProjectionDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

  // Filter State
  const [periodFilter, setPeriodFilter] = useState<'7days' | '30days' | 'month' | 'year' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [txForm, setTxForm] = useState<{
    id?: string;
    type: TransactionType;
    description: string;
    amount: string;
    category: TransactionCategory;
    relatedEntity: string;
    dueDate: string;
    status: TransactionStatus;
  }>({
    type: 'INCOME',
    description: '',
    amount: '',
    category: 'TUITION',
    relatedEntity: '',
    dueDate: new Date().toISOString().split('T')[0],
    status: 'PAID'
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await fetchTransactions();
      setTransactions(data);
    } catch (error) {
      console.error('Failed to load transactions', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Calculations ---

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

  const filteredTransactions = useMemo(() => {
    const { startDate, endDate } = getFilterDates();

    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      // Ajuste para comparar apenas datas (ignorando horas se necessário, mas aqui assumindo ISO string YYYY-MM-DD)
      const d = new Date(transactionDate.getFullYear(), transactionDate.getMonth(), transactionDate.getDate());
      const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const end = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

      const dateMatch = d >= start && d <= end;
      const studentMatch = studentFilter ? t.relatedEntity?.toLowerCase().includes(studentFilter.toLowerCase()) : true;

      return dateMatch && studentMatch;
    });
  }, [transactions, periodFilter, customStartDate, customEndDate, studentFilter]);

  const stats = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'INCOME' && t.status === 'PAID')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = filteredTransactions
      .filter(t => t.type === 'EXPENSE' && t.status === 'PAID')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netProfit = totalIncome - totalExpense;

    const totalExpectedIncome = filteredTransactions
      .filter(t => t.type === 'INCOME' && t.status !== 'CANCELLED')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalLateIncome = filteredTransactions
      .filter(t => t.type === 'INCOME' && t.status === 'LATE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const defaultRate = totalExpectedIncome > 0
      ? (totalLateIncome / totalExpectedIncome) * 100
      : 0;

    return { totalIncome, totalExpense, netProfit, defaultRate };
  }, [filteredTransactions]);

  // Mock Projection Logic based on history average
  const projection = useMemo(() => {
    const estimatedDailyIncome = 400;
    const estimatedDailyExpense = 250;

    const projectedIncome = estimatedDailyIncome * projectionDays;
    const projectedExpense = estimatedDailyExpense * projectionDays;

    return {
      income: projectedIncome,
      expense: projectedExpense,
      balance: projectedIncome - projectedExpense
    };
  }, [projectionDays]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
    const grouped: Record<string, { date: string, income: number, expense: number }> = {};

    filteredTransactions.forEach(t => {
      const date = new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      if (!grouped[date]) grouped[date] = { date, income: 0, expense: 0 };

      if (t.type === 'INCOME' && t.status === 'PAID') grouped[date].income += Number(t.amount);
      if (t.type === 'EXPENSE' && t.status === 'PAID') grouped[date].expense += Number(t.amount);
    });

    return Object.values(grouped).sort((a, b) => {
      const [da, ma] = a.date.split('/');
      const [db, mb] = b.date.split('/');
      return new Date(2023, parseInt(ma) - 1, parseInt(da)).getTime() - new Date(2023, parseInt(mb) - 1, parseInt(db)).getTime();
    });
  }, [filteredTransactions]);

  // --- Handlers ---

  const handleOpenModal = () => {
    setEditingTransaction(null);
    setTxForm({
      type: activeTab === 'expense' ? 'EXPENSE' : 'INCOME',
      description: '',
      amount: '',
      category: activeTab === 'expense' ? 'MAINTENANCE' : 'TUITION',
      relatedEntity: '',
      dueDate: new Date().toISOString().split('T')[0],
      status: 'PAID'
    });
    setShowModal(true);
  };

  const handleEditTransaction = (t: FinancialTransaction, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTransaction(t);
    setTxForm({
      id: t.id,
      type: t.type,
      description: t.description,
      amount: t.amount.toString(),
      category: t.category,
      relatedEntity: t.relatedEntity || '',
      dueDate: t.dueDate.split('T')[0],
      status: t.status
    });
    setShowModal(true);
    setOpenActionMenu(null);
  };

  const handleDeleteTransaction = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await deleteTransaction(id);
        await loadTransactions();
      } catch (error) {
        alert('Erro ao excluir transação');
      }
    }
    setOpenActionMenu(null);
  };

  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const newTx: FinancialTransaction = {
      id: editingTransaction ? editingTransaction.id : crypto.randomUUID(),
      description: txForm.description,
      type: txForm.type,
      category: txForm.category,
      amount: parseFloat(txForm.amount),
      date: editingTransaction ? editingTransaction.date : new Date().toISOString().split('T')[0],
      dueDate: txForm.dueDate,
      status: txForm.status,
      relatedEntity: txForm.relatedEntity
    };

    try {
      if (editingTransaction) {
        await updateTransaction(newTx.id, newTx);
      } else {
        await createTransaction(newTx);
      }
      await loadTransactions();
      setShowModal(false);
    } catch (error) {
      alert('Erro ao salvar transação');
      console.error(error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // --- Helper Components ---

  const StatusBadge = ({ status }: { status: string }) => {
    const styles: any = {
      'PAID': 'bg-green-100 text-green-700',
      'PENDING': 'bg-yellow-100 text-yellow-700',
      'LATE': 'bg-red-100 text-red-700',
      'CANCELLED': 'bg-slate-100 text-slate-600',
    };
    const labels: any = {
      'PAID': 'Pago',
      'PENDING': 'Pendente',
      'LATE': 'Atrasado',
      'CANCELLED': 'Cancelado',
    };
    return (
      <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${styles[status] || 'bg-slate-100'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const KpiCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg bg-opacity-10 ${color.replace('text-', 'bg-')}`}>
          <Icon size={24} className={color} />
        </div>
        {subtext && <span className="text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded">{subtext}</span>}
      </div>
      <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      <p className="text-sm text-slate-500 font-medium">{title}</p>
    </div>
  );

  const renderTransactionTable = (type: TransactionType) => {
    const filtered = filteredTransactions.filter(t => t.type === type);
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Descrição / Entidade</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Categoria</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Vencimento</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Valor</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((t) => (
                <tr
                  key={t.id}
                  className="hover:bg-slate-50 transition-colors group cursor-pointer"
                  onClick={() => setViewTransaction(t)}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{t.description}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      {type === 'INCOME' ? <TrendingUp size={12} className="text-green-500" /> : <TrendingDown size={12} className="text-red-500" />}
                      {t.relatedEntity}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {new Date(t.dueDate).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-700">
                    R$ {Number(t.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionMenu(openActionMenu === t.id ? null : t.id);
                      }}
                      className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {openActionMenu === t.id && (
                      <div className="absolute right-8 top-8 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-10 py-1 animate-in fade-in zoom-in-95 duration-200">
                        <button
                          onClick={(e) => handleEditTransaction(t, e)}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Edit size={16} /> Editar
                        </button>
                        <button
                          onClick={(e) => handleDeleteTransaction(t.id, e)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 size={16} /> Excluir
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6" onClick={() => setOpenActionMenu(null)}>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-only, .print-only * {
            visibility: visible;
          }
          .print-only {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestão Financeira</h2>
          <p className="text-slate-500">Acompanhe o fluxo de caixa e resultados</p>
          {studentFilter && (
            <div className="mt-2 flex items-center gap-2 bg-primary-50 text-primary-700 px-3 py-1 rounded-full w-fit text-sm">
              <Filter size={14} />
              Filtrando por aluno: <strong>{studentFilter}</strong>
              <button
                onClick={() => window.history.back()}
                className="ml-2 hover:bg-primary-100 rounded-full p-0.5"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1">
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
              className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 cursor-pointer"
            >
              <option value="7days">Últimos 7 dias</option>
              <option value="30days">Últimos 30 dias</option>
              <option value="month">Este Mês</option>
              <option value="year">Este Ano</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>

          {periodFilter === 'custom' && (
            <div className="flex gap-2">
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-1 text-sm"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="border border-slate-200 rounded-lg px-2 py-1 text-sm"
              />
            </div>
          )}

          <button onClick={handlePrint} className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white">
            <Printer size={20} />
          </button>
          <button
            onClick={handleOpenModal}
            className="px-4 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 flex items-center gap-2 shadow-lg shadow-primary-200"
          >
            <Plus size={18} />
            Nova Transação
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print-only">
        <KpiCard
          title="Receitas (Período)"
          value={`R$ ${stats.totalIncome.toFixed(2)}`}
          icon={TrendingUp}
          color="text-green-600"
        />
        <KpiCard
          title="Despesas (Período)"
          value={`R$ ${stats.totalExpense.toFixed(2)}`}
          icon={TrendingDown}
          color="text-red-600"
        />
        <KpiCard
          title="Lucro Líquido"
          value={`R$ ${stats.netProfit.toFixed(2)}`}
          icon={DollarSign}
          color={stats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}
        />
        <KpiCard
          title="Taxa de Inadimplência"
          value={`${stats.defaultRate.toFixed(1)}%`}
          icon={AlertOctagon}
          color="text-orange-600"
          subtext="Sobre receitas esperadas"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 no-print">
        <button
          onClick={() => setActiveTab('cashflow')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'cashflow'
            ? 'border-primary-600 text-primary-700'
            : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          Fluxo de Caixa
        </button>
        <button
          onClick={() => setActiveTab('income')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'income'
            ? 'border-green-600 text-green-700'
            : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          Recebimentos
        </button>
        <button
          onClick={() => setActiveTab('expense')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'expense'
            ? 'border-red-600 text-red-700'
            : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          Pagamentos
        </button>
      </div>

      {/* Content */}
      <div className="print-only">
        {activeTab === 'cashflow' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-80">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Evolução Financeira</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} tickFormatter={(value) => `R$${value}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, '']}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Receitas" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" name="Despesas" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Projections */}
            <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg no-print">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold">Projeção de Caixa</h3>
                  <p className="text-slate-400 text-sm">Estimativa baseada no histórico recente</p>
                </div>
                <select
                  value={projectionDays}
                  onChange={(e) => setProjectionDays(Number(e.target.value))}
                  className="bg-slate-800 border-slate-700 text-white rounded-lg text-sm"
                >
                  <option value={30}>Próximos 30 dias</option>
                  <option value={60}>Próximos 60 dias</option>
                  <option value={90}>Próximos 90 dias</option>
                </select>
              </div>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <p className="text-slate-400 text-xs uppercase font-bold mb-1">Receita Projetada</p>
                  <p className="text-2xl font-bold text-green-400">R$ {projection.income.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase font-bold mb-1">Despesa Projetada</p>
                  <p className="text-2xl font-bold text-red-400">R$ {projection.expense.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase font-bold mb-1">Saldo Projetado</p>
                  <p className={`text-2xl font-bold ${projection.balance >= 0 ? 'text-blue-400' : 'text-orange-400'}`}>
                    R$ {projection.balance.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'income' && renderTransactionTable('INCOME')}
        {activeTab === 'expense' && renderTransactionTable('EXPENSE')}
      </div>

      {/* Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSaveTransaction} className="p-6 space-y-4">
              <div className="flex gap-4 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setTxForm({ ...txForm, type: 'INCOME' })}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${txForm.type === 'INCOME'
                    ? 'bg-white text-green-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => setTxForm({ ...txForm, type: 'EXPENSE' })}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${txForm.type === 'EXPENSE'
                    ? 'bg-white text-red-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                    }`}
                >
                  Despesa
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <input
                  required
                  value={txForm.description}
                  onChange={e => setTxForm({ ...txForm, description: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Ex: Mensalidade João Silva"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={txForm.amount}
                    onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vencimento</label>
                  <input
                    required
                    type="date"
                    value={txForm.dueDate}
                    onChange={e => setTxForm({ ...txForm, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                  <select
                    value={txForm.category}
                    onChange={e => setTxForm({ ...txForm, category: e.target.value as TransactionCategory })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    <option value="TUITION">Mensalidade</option>
                    <option value="REGISTRATION">Matrícula</option>
                    <option value="MAINTENANCE">Manutenção</option>
                    <option value="SALARY">Salário</option>
                    <option value="EQUIPMENT">Equipamento</option>
                    <option value="OTHER">Outro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    value={txForm.status}
                    onChange={e => setTxForm({ ...txForm, status: e.target.value as TransactionStatus })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  >
                    <option value="PAID">Pago</option>
                    <option value="PENDING">Pendente</option>
                    <option value="LATE">Atrasado</option>
                    <option value="CANCELLED">Cancelado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Entidade Relacionada (Opcional)</label>
                <input
                  value={txForm.relatedEntity}
                  onChange={e => setTxForm({ ...txForm, relatedEntity: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Nome do aluno ou fornecedor"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 shadow-lg shadow-primary-200 transition-colors"
                >
                  Salvar
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