import React, { useState, useMemo, useEffect } from 'react';
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
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [activeTab, setActiveTab] = useState<'income' | 'expense' | 'cashflow'>('cashflow');
  const [showModal, setShowModal] = useState(false);
  const [viewTransaction, setViewTransaction] = useState<FinancialTransaction | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [projectionDays, setProjectionDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [openActionMenu, setOpenActionMenu] = useState<string | null>(null);

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

  const stats = useMemo(() => {
    const totalIncome = transactions
      .filter(t => t.type === 'INCOME' && t.status === 'PAID')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpense = transactions
      .filter(t => t.type === 'EXPENSE' && t.status === 'PAID')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const netProfit = totalIncome - totalExpense;

    const totalExpectedIncome = transactions
      .filter(t => t.type === 'INCOME' && t.status !== 'CANCELLED')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalLateIncome = transactions
      .filter(t => t.type === 'INCOME' && t.status === 'LATE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const defaultRate = totalExpectedIncome > 0
      ? (totalLateIncome / totalExpectedIncome) * 100
      : 0;

    return { totalIncome, totalExpense, netProfit, defaultRate };
  }, [transactions]);

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

    transactions.forEach(t => {
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
  }, [transactions]);

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
    const filtered = transactions.filter(t => t.type === type);
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
                    <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-lg border border-slate-200">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-slate-400" />
                      {new Date(t.dueDate).toLocaleDateString('pt-BR')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${type === 'INCOME' ? 'text-green-700' : 'text-red-700'}`}>
                    {type === 'INCOME' ? '+' : '-'} R$ {Number(t.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionMenu(openActionMenu === t.id ? null : t.id);
                      }}
                      className="text-slate-400 hover:text-primary-600 p-2 rounded-full hover:bg-slate-100"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {openActionMenu === t.id && (
                      <div className="absolute right-8 top-8 w-32 bg-white rounded-lg shadow-xl border border-slate-100 z-10 overflow-hidden">
                        <button
                          onClick={(e) => handleEditTransaction(t, e)}
                          className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Edit size={14} /> Editar
                        </button>
                        <button
                          onClick={(e) => handleDeleteTransaction(t.id, e)}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                        >
                          <Trash2 size={14} /> Excluir
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                    {loading ? 'Carregando...' : 'Nenhum registro encontrado.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Gestão Financeira</h2>
          <p className="text-slate-500 text-sm">Controle de fluxo de caixa, mensalidades e despesas.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium flex items-center gap-2">
            <Filter size={16} /> Filtros
          </button>
          <button
            onClick={handleOpenModal}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2 shadow-lg shadow-primary-200"
          >
            <Plus size={16} /> Nova Transação
          </button>
        </div>
      </div>

      {/* KPIs Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Receita (Mês)"
          value={`R$ ${stats.totalIncome.toFixed(2)}`}
          icon={TrendingUp}
          color="text-green-600"
        />
        <KpiCard
          title="Despesas (Mês)"
          value={`R$ ${stats.totalExpense.toFixed(2)}`}
          icon={TrendingDown}
          color="text-red-600"
        />
        <KpiCard
          title="Lucro Líquido"
          value={`R$ ${stats.netProfit.toFixed(2)}`}
          icon={DollarSign}
          color={stats.netProfit >= 0 ? "text-blue-600" : "text-red-600"}
        />
        <KpiCard
          title="Inadimplência"
          value={`${stats.defaultRate.toFixed(1)}%`}
          icon={AlertOctagon}
          color={stats.defaultRate > 10 ? "text-red-600" : "text-orange-500"}
          subtext="Taxa de atraso"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex w-full md:w-auto">
        <button
          onClick={() => setActiveTab('income')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'income' ? 'bg-green-50 text-green-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <ArrowDownRight size={16} /> Recebimentos
        </button>
        <button
          onClick={() => setActiveTab('expense')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'expense' ? 'bg-red-50 text-red-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <ArrowUpRight size={16} /> Pagamentos
        </button>
        <button
          onClick={() => setActiveTab('cashflow')}
          className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'cashflow' ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
        >
          <DollarSign size={16} /> Fluxo de Caixa
        </button>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'income' && renderTransactionTable('INCOME')}

        {activeTab === 'expense' && renderTransactionTable('EXPENSE')}

        {activeTab === 'cashflow' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
            {/* Main Chart */}
            <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">Fluxo Diário (Entradas vs Saídas)</h3>
                <select className="text-sm border border-slate-200 rounded-lg px-2 py-1 bg-slate-50">
                  <option>Últimos 30 dias</option>
                  <option>Este Ano</option>
                </select>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <Tooltip
                      cursor={{ fill: '#f1f5f9' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar name="Receitas" dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar name="Despesas" dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cashflow Summary */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Resumo do Período</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm text-slate-600">Saldo Inicial</span>
                    <span className="font-bold text-slate-800">R$ 12.500,00</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-100">
                    <span className="text-sm text-green-700 font-medium">Total Entradas</span>
                    <span className="font-bold text-green-700">+ R$ {stats.totalIncome.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-100">
                    <span className="text-sm text-red-700 font-medium">Total Saídas</span>
                    <span className="font-bold text-red-700">- R$ {stats.totalExpense.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-slate-200 pt-3 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800">Saldo Final</span>
                      <span className={`text-xl font-bold ${(12500 + stats.netProfit) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        R$ {(12500 + stats.netProfit).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-indigo-900 p-6 rounded-xl shadow-lg text-white relative overflow-hidden">
                <div className="relative z-10">
                  <h4 className="text-indigo-200 font-medium text-sm uppercase mb-2">Projeção de Caixa</h4>

                  {/* Period Selector */}
                  <div className="relative inline-block w-full mb-4">
                    <select
                      value={projectionDays}
                      onChange={(e) => setProjectionDays(Number(e.target.value))}
                      className="w-full appearance-none bg-indigo-800 border border-indigo-700 text-white py-2 pl-3 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer hover:bg-indigo-700 transition-colors font-medium"
                    >
                      <option value={7}>Próximos 7 dias</option>
                      <option value={15}>Próximos 15 dias</option>
                      <option value={30}>Próximos 30 dias</option>
                      <option value={60}>Próximos 60 dias</option>
                      <option value={90}>Próximos 90 dias</option>
                      <option value={180}>Próximos 6 meses</option>
                      <option value={365}>Próximo 1 ano</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-300 pointer-events-none" size={16} />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-indigo-200 text-sm">A receber</span>
                      <span className="font-bold text-green-300">R$ {projection.income.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-indigo-200 text-sm">A pagar</span>
                      <span className="font-bold text-red-300">R$ {projection.expense.toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-indigo-800 flex justify-between items-center">
                      <span className="text-indigo-100 font-medium">Saldo Previsto</span>
                      <span className={`font-bold ${projection.balance >= 0 ? 'text-white' : 'text-red-200'}`}>
                        R$ {projection.balance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-800 rounded-full opacity-50"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">{editingTransaction ? 'Editar Transação' : 'Nova Transação'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-red-500">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveTransaction} className="p-6 space-y-6 overflow-y-auto">
              {/* Type Toggle */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTxForm({ ...txForm, type: 'INCOME', category: 'TUITION' })}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${txForm.type === 'INCOME'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50'
                    }`}
                >
                  <ArrowDownRight size={24} />
                  <span className="font-bold">Recebimento</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTxForm({ ...txForm, type: 'EXPENSE', category: 'MAINTENANCE' })}
                  className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${txForm.type === 'EXPENSE'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50'
                    }`}
                >
                  <ArrowUpRight size={24} />
                  <span className="font-bold">Pagamento</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                  <input
                    required
                    placeholder={txForm.type === 'INCOME' ? "Ex: Mensalidade Março - João" : "Ex: Compra de Cloro"}
                    value={txForm.description}
                    onChange={e => setTxForm({ ...txForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={txForm.amount}
                    onChange={e => setTxForm({ ...txForm, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Categoria</label>
                  <select
                    value={txForm.category}
                    onChange={e => setTxForm({ ...txForm, category: e.target.value as any })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    {txForm.type === 'INCOME' ? (
                      <>
                        <option value="TUITION">Mensalidade</option>
                        <option value="OTHER">Outras Receitas</option>
                      </>
                    ) : (
                      <>
                        <option value="MAINTENANCE">Manutenção</option>
                        <option value="SALARY">Salários</option>
                        <option value="RENT">Aluguel</option>
                        <option value="EQUIPMENT">Equipamentos</option>
                        <option value="OTHER">Outros</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {txForm.type === 'INCOME' ? 'Aluno / Pagador' : 'Fornecedor / Favorecido'}
                  </label>
                  <input
                    placeholder="Nome da entidade"
                    value={txForm.relatedEntity}
                    onChange={e => setTxForm({ ...txForm, relatedEntity: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Data de Vencimento</label>
                  <input
                    type="date"
                    required
                    value={txForm.dueDate}
                    onChange={e => setTxForm({ ...txForm, dueDate: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Situação Atual</label>
                  <div className="flex gap-3">
                    <label className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg border cursor-pointer transition-colors ${txForm.status === 'PAID'
                      ? 'bg-green-50 border-green-500 text-green-700 font-bold'
                      : 'border-slate-200 hover:bg-slate-50'
                      }`}>
                      <input
                        type="radio"
                        name="status"
                        checked={txForm.status === 'PAID'}
                        onChange={() => setTxForm({ ...txForm, status: 'PAID' })}
                        className="hidden"
                      />
                      <Check size={16} className="mr-2" />
                      {txForm.type === 'INCOME' ? 'Recebido' : 'Pago'}
                    </label>
                    <label className={`flex-1 flex items-center justify-center px-4 py-2 rounded-lg border cursor-pointer transition-colors ${txForm.status === 'PENDING'
                      ? 'bg-yellow-50 border-yellow-500 text-yellow-700 font-bold'
                      : 'border-slate-200 hover:bg-slate-50'
                      }`}>
                      <input
                        type="radio"
                        name="status"
                        checked={txForm.status === 'PENDING'}
                        onChange={() => setTxForm({ ...txForm, status: 'PENDING' })}
                        className="hidden"
                      />
                      Pendente
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-8 py-2.5 text-white rounded-lg font-bold shadow-lg transition-colors flex items-center gap-2 ${txForm.type === 'INCOME' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                  <Check size={18} /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Transaction Modal (Printable) */}
      {viewTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #printable-content, #printable-content * {
                visibility: visible;
              }
              #printable-content {
                position: fixed;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background: white;
                padding: 40px;
                z-index: 9999;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>
          <div id="printable-content" className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-800">Detalhes da Transação</h3>
                <p className="text-slate-500 text-sm">ID: {viewTransaction.id.slice(0, 8)}</p>
              </div>
              <button onClick={() => setViewTransaction(null)} className="text-slate-400 hover:text-red-500 no-print">
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 space-y-6">
              <div className="flex justify-center mb-6">
                <div className={`p-4 rounded-full ${viewTransaction.type === 'INCOME' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                  {viewTransaction.type === 'INCOME' ? <ArrowDownRight size={48} /> : <ArrowUpRight size={48} />}
                </div>
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold text-slate-800">
                  R$ {Number(viewTransaction.amount).toFixed(2)}
                </h2>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold uppercase ${viewTransaction.status === 'PAID' ? 'bg-green-100 text-green-700' :
                    viewTransaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                  }`}>
                  {viewTransaction.status === 'PAID' ? 'Pago' : viewTransaction.status === 'PENDING' ? 'Pendente' : 'Atrasado'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Descrição</p>
                  <p className="font-medium text-slate-800">{viewTransaction.description}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Categoria</p>
                  <p className="font-medium text-slate-800">{viewTransaction.category}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Entidade</p>
                  <p className="font-medium text-slate-800">{viewTransaction.relatedEntity || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-1">Vencimento</p>
                  <p className="font-medium text-slate-800">{new Date(viewTransaction.dueDate).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>

              <div className="pt-8 mt-4 border-t-2 border-dashed border-slate-200 text-center">
                <p className="text-xs text-slate-400">Comprovante gerado em {new Date().toLocaleString('pt-BR')}</p>
                <p className="text-xs text-slate-400 font-bold mt-1">Hidro Fitness Sistema</p>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 no-print">
              <button
                onClick={() => setViewTransaction(null)}
                className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={handlePrint}
                className="px-6 py-2 bg-slate-800 text-white rounded-lg font-bold hover:bg-slate-900 shadow-lg flex items-center gap-2"
              >
                <Printer size={18} /> Imprimir PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;