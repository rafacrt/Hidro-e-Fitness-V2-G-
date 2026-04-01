import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, X, RotateCcw, CheckCircle, ChevronLeft, ChevronRight, Check, Info
} from 'lucide-react';
import { fetchStudents, fetchTransactions, fetchPlans, createTransaction, deleteTransaction } from '../services/api';
import { FinancialTransaction } from '../types';

// ── Constants ─────────────────────────────────────────────────────────────────

type PaymentMethodId = 'DINHEIRO' | 'PIX' | 'DEBITO' | 'CREDITO';
type StatusFilter    = 'all' | 'LATE' | 'PENDING' | 'PAID';

const PAYMENT_METHODS: { id: PaymentMethodId; label: string; emoji: string }[] = [
  { id: 'DINHEIRO', label: 'Dinheiro', emoji: '💵' },
  { id: 'PIX',      label: 'Pix',      emoji: '📱' },
  { id: 'DEBITO',   label: 'Débito',   emoji: '💳' },
  { id: 'CREDITO',  label: 'Crédito',  emoji: '💳' },
];

const PAYMENT_LABEL: Record<string, string> = {
  DINHEIRO: '💵 Dinheiro',
  PIX:      '📱 Pix',
  DEBITO:   '💳 Débito',
  CREDITO:  '💳 Crédito',
  CHEQUE:   '📄 Cheque', // legado — pode existir em registros antigos
};

const FREQ_COLOR: Record<string, string> = {
  Mensal:     'bg-blue-50 text-blue-700',
  Bimestral:  'bg-purple-50 text-purple-700',
  Trimestral: 'bg-orange-50 text-orange-700',
  Semestral:  'bg-pink-50 text-pink-700',
  Anual:      'bg-teal-50 text-teal-700',
};

/** Quantos meses cada periodicidade cobre */
const FREQ_MONTHS: Record<string, number> = {
  Mensal:     1,
  Bimestral:  2,
  Trimestral: 3,
  Semestral:  6,
  Anual:      12,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Retorna o número do mês coberto pela próxima data de vencimento do período */
function getPeriodLabel(year: number, month: number, freqMonths: number): string {
  if (freqMonths <= 1) {
    return new Date(year, month - 1, 1)
      .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month - 1 + freqMonths - 1, 1);
  const sMes  = start.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  const eMes  = end.toLocaleDateString('pt-BR',   { month: 'short' }).replace('.', '');
  const eAno  = end.getFullYear();
  return `${sMes} – ${eMes}/${eAno}`;
}

function getPeriodDescription(year: number, month: number, freqMonths: number, studentName: string): string {
  const freqLabel: Record<number, string> = { 1: 'Mensal', 2: 'Bimestral', 3: 'Trimestral', 6: 'Semestral', 12: 'Anual' };
  const label = freqLabel[freqMonths] || `${freqMonths}x`;
  if (freqMonths === 1) {
    const m = String(month).padStart(2, '0');
    return `Mensalidade ${m}/${year} - ${studentName}`;
  }
  return `Mensalidade ${label} ${getPeriodLabel(year, month, freqMonths)} - ${studentName}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

const Caixa: React.FC = () => {
  const [students,     setStudents]     = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [plans,        setPlans]        = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>('all');

  // Modal
  const [receiveItem,   setReceiveItem]   = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId | null>(null);
  const [customAmount,  setCustomAmount]  = useState('');
  const [receiptDate,   setReceiptDate]   = useState('');
  const [observation,   setObservation]   = useState('');
  const [saving,        setSaving]        = useState(false);

  // ── Data ────────────────────────────────────────────────────────────────────

  const loadData = async () => {
    try {
      setLoading(true);
      const [s, t, p] = await Promise.all([fetchStudents(), fetchTransactions(), fetchPlans()]);
      setStudents(s);
      setTransactions(t);
      setPlans(p);
    } catch (e) {
      console.error('Caixa: erro ao carregar dados', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ── Month navigation ─────────────────────────────────────────────────────────

  const monthDate = new Date(selectedMonth + '-15');
  const monthName = monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const today = new Date();
  const currentYM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const isFutureMonth = selectedMonth > currentYM;

  const prevMonth = () => {
    const d = new Date(selectedMonth + '-15');
    d.setMonth(d.getMonth() - 1);
    setSelectedMonth(d.toISOString().slice(0, 7));
  };

  const nextMonth = () => {
    const d = new Date(selectedMonth + '-15');
    d.setMonth(d.getMonth() + 1);
    setSelectedMonth(d.toISOString().slice(0, 7));
  };

  // ── Plan helpers ─────────────────────────────────────────────────────────────

  const parsePlanNames = (planStr: string | undefined): string[] => {
    if (!planStr) return [];
    try {
      const parsed = JSON.parse(planStr);
      return Array.isArray(parsed) ? parsed : [planStr];
    } catch { return [planStr]; }
  };

  // ── Tuition list ──────────────────────────────────────────────────────────────

  const tuitionList = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const endOfMonth    = new Date(year, month, 0);
    const now           = new Date();

    const list = students
      .filter(s => s.status === 'Ativo')
      .map(student => {
        // Skip if enrolled after this month
        if (student.enrollmentDate) {
          let enrolDate: Date;
          if (student.enrollmentDate.includes('T')) enrolDate = new Date(student.enrollmentDate);
          else {
            const [ey, em, ed] = student.enrollmentDate.split('-').map(Number);
            enrolDate = new Date(ey, em - 1, ed);
          }
          if (enrolDate > endOfMonth) return null;
        }

        // Resolve plan → amount + frequency
        const planNames = parsePlanNames(student.plan);
        let amount = 0;
        let planLabel = '';
        let planFrequency = '';
        let freqMonths = 1;

        if (planNames.length > 0) {
          const found = planNames
            .map(name => plans.find(pl => pl.name.toLowerCase().trim() === name.toLowerCase().trim()))
            .filter(Boolean);

          if (found.length > 0) {
            amount       = found.reduce((sum: number, p: any) => sum + Number(p.price), 0);
            planLabel    = found.map((p: any) => p.name).join(' + ');
            const freqs  = [...new Set(found.map((p: any) => p.frequency))] as string[];
            planFrequency = freqs.join('/');
            // Use the LARGEST frequency window among combined plans
            freqMonths   = Math.max(...freqs.map(f => FREQ_MONTHS[f] || 1));
          } else {
            planLabel = planNames.join(' + ');
          }
        } else {
          planLabel = student.plan || 'Sem Plano';
        }

        /**
         * Find a transaction that "covers" the selected month.
         * A transaction covers month M if it was recorded within
         * the freqMonths window ending at M.
         * e.g.: trimestral (3 months) → a payment in Jan covers Jan, Feb, Mar.
         */
        const transaction = transactions.find(t => {
          if (t.relatedEntity !== student.name) return false;
          if (t.category !== 'TUITION' || t.type !== 'INCOME') return false;

          let tDate: Date;
          if (t.date.includes('T')) tDate = new Date(t.date);
          else {
            const [ty, tm, td] = t.date.split('-').map(Number);
            tDate = new Date(ty, tm - 1, td);
          }

          // monthsDiff: positive = transaction is in the past relative to selectedMonth
          const tYear  = tDate.getFullYear();
          const tMonth = tDate.getMonth() + 1;
          const diff   = (year - tYear) * 12 + (month - tMonth);

          // Transaction covers selectedMonth if 0 ≤ diff < freqMonths
          return diff >= 0 && diff < freqMonths;
        });

        // Override amount with actual transaction amount if present
        if (transaction && Number(transaction.amount) > 0) {
          amount = Number(transaction.amount);
        }

        // Determine status
        let status: 'PAID' | 'PENDING' | 'LATE' = 'PENDING';
        if (transaction) {
          status = transaction.status === 'PAID'  ? 'PAID'
                 : transaction.status === 'LATE'  ? 'LATE'
                 : 'PENDING';
        } else {
          // Future months are always PENDING — can't be late yet
          const isFuture = year > now.getFullYear()
            || (year === now.getFullYear() && month > now.getMonth() + 1);
          if (isFuture) {
            status = 'PENDING';
          } else {
            const dueDate = new Date(year, month - 1, 10);
            status = now > dueDate ? 'LATE' : 'PENDING';
          }
        }

        return { student, planLabel, planFrequency, freqMonths, amount, status, transaction };
      })
      .filter(Boolean) as any[];

    // Sort: LATE → PENDING → PAID, then A–Z
    const order: Record<string, number> = { LATE: 0, PENDING: 1, PAID: 2 };
    return list.sort(
      (a, b) => order[a.status] - order[b.status]
        || a.student.name.localeCompare(b.student.name, 'pt-BR')
    );
  }, [students, transactions, plans, selectedMonth]);

  const filtered = useMemo(() => tuitionList.filter(item => {
    const matchSearch = !search || item.student.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchSearch && matchStatus;
  }), [tuitionList, search, statusFilter]);

  const counts = useMemo(() => ({
    paid:    tuitionList.filter(i => i.status === 'PAID').length,
    pending: tuitionList.filter(i => i.status === 'PENDING').length,
    late:    tuitionList.filter(i => i.status === 'LATE').length,
  }), [tuitionList]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const openReceiveModal = (item: any) => {
    setReceiveItem(item);
    setPaymentMethod(null);
    setCustomAmount(Number(item.amount).toFixed(2).replace('.', ','));
    setReceiptDate(new Date().toISOString().split('T')[0]);
    setObservation('');
  };

  const handleConfirmReceive = async () => {
    if (!receiveItem || !paymentMethod) return;
    setSaving(true);
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const dueDate       = new Date(year, month - 1, 10).toISOString().split('T')[0];
      const amountValue   = parseFloat(customAmount.replace(',', '.'));
      const desc          = getPeriodDescription(year, month, receiveItem.freqMonths, receiveItem.student.name);

      const tx: FinancialTransaction = {
        id:            crypto.randomUUID(),
        description:   observation ? `${desc} (${observation})` : desc,
        type:          'INCOME',
        category:      'TUITION',
        amount:        amountValue,
        date:          receiptDate,
        dueDate,
        status:        'PAID',
        relatedEntity: receiveItem.student.name,
        paymentMethod: paymentMethod as any,
      };

      await createTransaction(tx);
      await loadData();
      setReceiveItem(null);
    } catch (e) {
      alert('Erro ao registrar recebimento. Tente novamente.');
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = async (item: any) => {
    if (!item.transaction) return;
    if (!window.confirm(`Desfazer recebimento de "${item.student.name}"?\nA mensalidade voltará a ficar pendente.`)) return;
    try {
      await deleteTransaction(item.transaction.id);
      await loadData();
    } catch {
      alert('Erro ao estornar. Tente novamente.');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400 gap-3">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500" />
      Carregando...
    </div>
  );

  const [selYear, selMonth] = selectedMonth.split('-').map(Number);

  return (
    <div className="space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Caixa</h2>
        <p className="text-slate-500 text-sm">Recebimento de mensalidades — valores não visíveis na listagem</p>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="text-center">
          <p className="font-bold text-slate-800 text-lg capitalize">{monthName}</p>
          {isFutureMonth ? (
            <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-0.5">
              <Info size={11} /> Mês futuro — lançamento antecipado
            </span>
          ) : (
            <p className="text-xs text-slate-400 mt-0.5">Referência de mensalidades</p>
          )}
        </div>

        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Status counters — counts only, no R$ visible */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { key: 'PAID',    count: counts.paid,    label: '✅ Pagos',      actCls: 'bg-green-600 border-green-600',   inaCls: 'bg-white border-slate-200 hover:border-green-300 hover:bg-green-50',   numCls: 'text-green-600' },
          { key: 'PENDING', count: counts.pending, label: '⚠️ Pendentes',  actCls: 'bg-yellow-500 border-yellow-500', inaCls: 'bg-white border-slate-200 hover:border-yellow-300 hover:bg-yellow-50', numCls: 'text-yellow-600' },
          { key: 'LATE',    count: counts.late,    label: '🔴 Atrasados',  actCls: 'bg-red-600 border-red-600',       inaCls: 'bg-white border-slate-200 hover:border-red-300 hover:bg-red-50',       numCls: 'text-red-600' },
        ] as const).map(s => {
          const isActive = statusFilter === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setStatusFilter(isActive ? 'all' : s.key)}
              className={`p-4 rounded-xl border text-center transition-all ${isActive ? s.actCls + ' text-white shadow-md' : s.inaCls}`}
            >
              <p className={`text-2xl font-bold ${isActive ? 'text-white' : s.numCls}`}>{s.count}</p>
              <p className={`text-xs font-medium mt-1 ${isActive ? 'text-white/80' : 'text-slate-500'}`}>{s.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar aluno..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tuition table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Aluno</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Plano</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Valor</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400 text-sm">
                    Nenhum aluno encontrado para este filtro.
                  </td>
                </tr>
              )}
              {filtered.map((item: any) => (
                <tr
                  key={item.student.id}
                  className={`transition-colors ${
                    item.status === 'LATE'    ? 'bg-red-50/40 hover:bg-red-50/70' :
                    item.status === 'PENDING' ? 'hover:bg-yellow-50/40' :
                                               'hover:bg-green-50/20'
                  }`}
                >
                  <td className="px-5 py-3 font-medium text-slate-800 text-sm">{item.student.name}</td>
                  <td className="px-5 py-3">
                    <div className="text-sm text-slate-700">{item.planLabel || 'Sem Plano'}</div>
                    {item.planFrequency && (
                      <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${FREQ_COLOR[item.planFrequency] || 'bg-slate-100 text-slate-500'}`}>
                        {item.planFrequency}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm font-semibold text-slate-700">
                    {item.amount > 0 ? `R$ ${Number(item.amount).toFixed(2).replace('.', ',')}` : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-0.5">
                      {item.status === 'PAID'    && <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold w-fit"><Check size={11} /> Pago</span>}
                      {item.status === 'PENDING' && <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-bold w-fit">⚠️ Pendente</span>}
                      {item.status === 'LATE'    && <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold w-fit">🔴 Atrasado</span>}
                      {item.transaction?.paymentMethod && (
                        <span className="text-xs text-slate-400 mt-0.5">{PAYMENT_LABEL[item.transaction.paymentMethod] || item.transaction.paymentMethod}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {item.status !== 'PAID' ? (
                      <button
                        onClick={() => openReceiveModal(item)}
                        className="px-4 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                      >
                        Receber
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUndo(item)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Estornar recebimento"
                      >
                        <RotateCcw size={15} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 text-right">
            {filtered.length} aluno{filtered.length !== 1 ? 's' : ''} exibido{filtered.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* ── Receive Modal ─────────────────────────────────────────────────────── */}
      {receiveItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-lg leading-tight">Receber Mensalidade</h3>
                <p className="text-sm text-slate-500 capitalize mt-0.5">{monthName}</p>
              </div>
              <button
                onClick={() => setReceiveItem(null)}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">

              {/* Student + plan info */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-1.5">
                <p className="font-bold text-slate-800">{receiveItem.student.name}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-slate-600">{receiveItem.planLabel || 'Sem Plano'}</span>
                  {receiveItem.planFrequency && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${FREQ_COLOR[receiveItem.planFrequency] || 'bg-slate-100 text-slate-500'}`}>
                      {receiveItem.planFrequency}
                    </span>
                  )}
                </div>
                {/* Period coverage info */}
                {receiveItem.freqMonths > 1 && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                    <Info size={12} />
                    Cobre o período: <strong>{getPeriodLabel(selYear, selMonth, receiveItem.freqMonths)}</strong>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Valor a Receber</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">R$</span>
                  <input
                    type="text"
                    value={customAmount}
                    onChange={e => setCustomAmount(e.target.value.replace(/[^0-9,]/g, ''))}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-xl font-bold text-slate-800 focus:ring-2 focus:ring-primary-500 outline-none text-center"
                  />
                </div>
              </div>

              {/* Payment method — 4 options, 2×2 grid */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Forma de Pagamento</label>
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map(pm => (
                    <button
                      key={pm.id}
                      onClick={() => setPaymentMethod(pm.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === pm.id
                          ? 'border-primary-500 bg-primary-50 shadow-sm'
                          : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-2xl leading-none">{pm.emoji}</span>
                      <span className={`text-xs font-semibold text-center leading-tight ${paymentMethod === pm.id ? 'text-primary-700' : 'text-slate-600'}`}>
                        {pm.label}
                      </span>
                    </button>
                  ))}
                </div>
                {!paymentMethod && (
                  <p className="text-xs text-slate-400 mt-2">Selecione a forma de pagamento para continuar</p>
                )}
              </div>

              {/* Date + observation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Data de Recebimento</label>
                  <input
                    type="date"
                    value={receiptDate}
                    onChange={e => setReceiptDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Observação <span className="font-normal text-slate-400">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={observation}
                    onChange={e => setObservation(e.target.value)}
                    placeholder="Ex: Desconto aplicado"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setReceiveItem(null)}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReceive}
                disabled={!paymentMethod || saving}
                className="flex-[2] py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-100"
              >
                {saving
                  ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <CheckCircle size={18} />
                }
                Confirmar Recebimento
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Caixa;
