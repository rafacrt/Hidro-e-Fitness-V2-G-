import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  Search, X, CheckCircle, ChevronLeft, ChevronRight, Check, Info, Trash2
} from 'lucide-react';
import { fetchStudents, fetchTransactions, fetchPlans, createTransaction, deleteTransaction } from '../services/api';
import { FinancialTransaction } from '../types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PendingDelete {
  toastId:        string;
  label:          string;          // "Mensalidade de João" | "3 mensalidades"
  transactionIds: string[];
  timeoutId:      ReturnType<typeof setTimeout>;
}

// ── Constants ─────────────────────────────────────────────────────────────────

type PaymentMethodId = 'DINHEIRO' | 'PIX' | 'DEBITO' | 'CREDITO';
type StatusFilter    = 'all' | 'LATE' | 'PENDING' | 'PAID';

const UNDO_DELAY_MS = 5000;

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
  CHEQUE:   '📄 Cheque',
};

const FREQ_COLOR: Record<string, string> = {
  Mensal:     'bg-blue-50 text-blue-700',
  Bimestral:  'bg-purple-50 text-purple-700',
  Trimestral: 'bg-orange-50 text-orange-700',
  Semestral:  'bg-pink-50 text-pink-700',
  Anual:      'bg-teal-50 text-teal-700',
};

const FREQ_MONTHS: Record<string, number> = {
  Mensal: 1, Bimestral: 2, Trimestral: 3, Semestral: 6, Anual: 12,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getPeriodLabel(year: number, month: number, freqMonths: number): string {
  if (freqMonths <= 1)
    return new Date(year, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const start = new Date(year, month - 1, 1);
  const end   = new Date(year, month - 1 + freqMonths - 1, 1);
  const sMes  = start.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  const eMes  = end.toLocaleDateString('pt-BR',   { month: 'short' }).replace('.', '');
  return `${sMes} – ${eMes}/${end.getFullYear()}`;
}

function getPeriodDescription(year: number, month: number, freqMonths: number, studentName: string): string {
  const labels: Record<number, string> = { 1: 'Mensal', 2: 'Bimestral', 3: 'Trimestral', 6: 'Semestral', 12: 'Anual' };
  if (freqMonths === 1)
    return `Mensalidade ${String(month).padStart(2, '0')}/${year} - ${studentName}`;
  return `Mensalidade ${labels[freqMonths] ?? `${freqMonths}x`} ${getPeriodLabel(year, month, freqMonths)} - ${studentName}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

const Caixa: React.FC = () => {

  // ── Raw data ──────────────────────────────────────────────────────────────

  const [students,     setStudents]     = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [plans,        setPlans]        = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);

  // ── UI filters ────────────────────────────────────────────────────────────

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [search,        setSearch]        = useState('');
  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>('all');

  // ── Receive modal ─────────────────────────────────────────────────────────

  const [receiveItem,   setReceiveItem]   = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId | null>(null);
  const [paymentMode,   setPaymentMode]   = useState<'AVISTA' | 'PARCELADO'>('AVISTA');
  const [customAmount,  setCustomAmount]  = useState('');
  const [receiptDate,   setReceiptDate]   = useState('');
  const [observation,   setObservation]   = useState('');
  const [saving,        setSaving]        = useState(false);

  // ── Delete / undo ─────────────────────────────────────────────────────────

  const [pendingDeletes, setPendingDeletes] = useState<PendingDelete[]>([]);

  // ── Checkbox mode (WordPress-style) ──────────────────────────────────────

  const [checkboxMode, setCheckboxMode] = useState(false);
  const [selectedIds,  setSelectedIds]  = useState<Set<number>>(new Set());
  const [deleting,     setDeleting]     = useState(false);

  const masterCheckboxRef = useRef<HTMLInputElement>(null);

  // ── Load data ─────────────────────────────────────────────────────────────

  const cancelAllPendingDeletes = useCallback(() => {
    setPendingDeletes(prev => {
      prev.forEach(pd => clearTimeout(pd.timeoutId));
      return [];
    });
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [s, t, p] = await Promise.all([fetchStudents(), fetchTransactions(), fetchPlans()]);
      setStudents(s);
      setTransactions(t);
      setPlans(p);
      setCheckboxMode(false);
      setSelectedIds(new Set());
    } catch (e) {
      console.error('Caixa: erro ao carregar dados', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Cleanup timers on unmount
  useEffect(() => () => cancelAllPendingDeletes(), [cancelAllPendingDeletes]);

  // ── Month navigation ──────────────────────────────────────────────────────

  const monthDate = new Date(selectedMonth + '-15');
  const monthName = monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const today     = new Date();
  const currentYM = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const isFutureMonth = selectedMonth > currentYM;

  const changeMonth = (delta: number) => {
    cancelAllPendingDeletes();
    const d = new Date(selectedMonth + '-15');
    d.setMonth(d.getMonth() + delta);
    setSelectedMonth(d.toISOString().slice(0, 7));
    setCheckboxMode(false);
    setSelectedIds(new Set());
  };

  // ── Plan helpers ──────────────────────────────────────────────────────────

  const parsePlanNames = (planStr: string | undefined): string[] => {
    if (!planStr) return [];
    try {
      const p = JSON.parse(planStr);
      return Array.isArray(p) ? p : [planStr];
    } catch { return [planStr]; }
  };

  // ── Tuition list ──────────────────────────────────────────────────────────

  const tuitionList = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const endOfMonth    = new Date(year, month, 0);
    const now           = new Date();

    return students
      .filter(s => s.status === 'Ativo')
      .map(student => {
        const billingStartStr = student.reactivationDate || student.enrollmentDate;
        if (billingStartStr) {
          let bs: Date;
          if (billingStartStr.includes('T')) bs = new Date(billingStartStr);
          else { const [by, bm, bd] = billingStartStr.split('-').map(Number); bs = new Date(by, bm - 1, bd); }
          if (bs > endOfMonth) return null;
        }

        const ids: string[] = (student as any).planIds?.length
          ? (student as any).planIds
          : parsePlanNames(student.plan);
        let amount = 0, planLabel = '', planFrequency = '', freqMonths = 1;

        if (ids.length > 0) {
          const found = ids
            .map((id: string) =>
              plans.find((pl: any) => String(pl.id) === String(id)) ||
              plans.find((pl: any) => pl.name.toLowerCase().trim() === String(id).toLowerCase().trim())
            )
            .filter(Boolean);
          if (found.length > 0) {
            amount        = found.reduce((s: number, p: any) => s + Number(p.price), 0);
            planLabel     = found.map((p: any) => p.name).join(' + ');
            const freqs   = [...new Set(found.map((p: any) => p.frequency))] as string[];
            planFrequency = freqs.join('/');
            freqMonths    = Math.max(...freqs.map(f => FREQ_MONTHS[f] || 1));
          } else {
            planLabel = ids.join(' + ');
          }
        } else {
          planLabel = student.plan || 'Sem Plano';
        }

        const parceladoTxs = transactions.filter((t: any) =>
          t.relatedEntity === student.name && t.category === 'TUITION' &&
          t.type === 'INCOME' && t.status === 'PAID' && (t.installmentTotal || 0) > 1
        );
        const isParcelado      = parceladoTxs.length > 0;
        const installTotal     = isParcelado ? (parceladoTxs[0] as any).installmentTotal : freqMonths;
        const paidInstallments = parceladoTxs.length;
        const nextInstallment  = paidInstallments + 1;
        const effectiveFreqMonths = isParcelado ? 1 : freqMonths;

        const transaction = transactions.find(t => {
          if (t.relatedEntity !== student.name || t.category !== 'TUITION' || t.type !== 'INCOME') return false;
          let tDate: Date;
          if (t.date.includes('T')) tDate = new Date(t.date);
          else { const [ty, tm, td] = t.date.split('-').map(Number); tDate = new Date(ty, tm - 1, td); }
          const diff = (year - tDate.getFullYear()) * 12 + (month - (tDate.getMonth() + 1));
          return diff >= 0 && diff < effectiveFreqMonths;
        });

        if (transaction && Number(transaction.amount) > 0) amount = Number(transaction.amount);

        let status: 'PAID' | 'PENDING' | 'LATE' = 'PENDING';
        if (transaction) {
          status = transaction.status === 'PAID' ? 'PAID' : transaction.status === 'LATE' ? 'LATE' : 'PENDING';
        } else {
          const isFuture = year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1);
          status = (!isFuture && now > new Date(year, month - 1, 10)) ? 'LATE' : 'PENDING';
        }

        return { student, planLabel, planFrequency, freqMonths, amount, status, transaction, isParcelado, installTotal, paidInstallments, nextInstallment };
      })
      .filter(Boolean) as any[];
  }, [students, transactions, plans, selectedMonth]);

  const filtered = useMemo(() => {
    const pendingTxIds = new Set(pendingDeletes.flatMap(pd => pd.transactionIds));
    return tuitionList
      .filter(item => {
        if (!search && statusFilter === 'all') return true;
        const matchSearch = !search || item.student.name.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || item.status === statusFilter;
        return matchSearch && matchStatus;
      })
      // Hide items whose transaction is pending deletion
      .filter(item => !item.transaction || !pendingTxIds.has(item.transaction.id));
  }, [tuitionList, search, statusFilter, pendingDeletes]);

  const counts = useMemo(() => ({
    paid:    tuitionList.filter(i => i.status === 'PAID').length,
    pending: tuitionList.filter(i => i.status === 'PENDING').length,
    late:    tuitionList.filter(i => i.status === 'LATE').length,
  }), [tuitionList]);

  // Items that can be selected (have a DB transaction and aren't pending delete)
  const selectableItems = useMemo(
    () => filtered.filter(i => i.transaction && i.status !== 'PAID'),
    [filtered]
  );
  const allSelected  = selectableItems.length > 0 && selectableItems.every(i => selectedIds.has(i.student.id));
  const someSelected = !allSelected && selectableItems.some(i => selectedIds.has(i.student.id));
  const selectedCount = filtered.filter(i => selectedIds.has(i.student.id) && i.transaction).length;

  // Sync indeterminate state on master checkbox
  useEffect(() => {
    if (masterCheckboxRef.current)
      masterCheckboxRef.current.indeterminate = checkboxMode && someSelected;
  }, [checkboxMode, someSelected]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  /** Master checkbox — WordPress-style:
   *  Off → click → checkbox mode ON + select all
   *  On, all selected → click → select none + mode OFF
   *  On, partial → click → select all
   */
  const handleMasterCheckbox = () => {
    if (!checkboxMode) {
      setCheckboxMode(true);
      setSelectedIds(new Set(selectableItems.map(i => i.student.id)));
    } else if (allSelected) {
      setSelectedIds(new Set());
      setCheckboxMode(false);
    } else {
      setSelectedIds(new Set(selectableItems.map(i => i.student.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openReceiveModal = (item: any) => {
    setReceiveItem(item);
    setPaymentMethod(null);
    setPaymentMode(item.isParcelado ? 'PARCELADO' : (item.freqMonths > 1 ? 'PARCELADO' : 'AVISTA'));
    setCustomAmount(Number(item.amount).toFixed(2).replace('.', ','));
    setReceiptDate(new Date().toISOString().split('T')[0]);
    setObservation('');
  };

  const handleConfirmReceive = async () => {
    if (!receiveItem || !paymentMethod) return;
    setSaving(true);
    try {
      const [year, month] = selectedMonth.split('-').map(Number);
      const dueDate  = new Date(year, month - 1, 10).toISOString().split('T')[0];
      const amount   = parseFloat(customAmount.replace(',', '.'));
      const instLabel = paymentMode === 'PARCELADO' && receiveItem.freqMonths > 1
        ? ` [${receiveItem.nextInstallment}ª/${receiveItem.installTotal}]` : '';
      const desc = getPeriodDescription(year, month, receiveItem.freqMonths, receiveItem.student.name) + instLabel;
      const installmentFields = paymentMode === 'PARCELADO' && receiveItem.freqMonths > 1
        ? { installmentNumber: receiveItem.nextInstallment, installmentTotal: receiveItem.installTotal }
        : {};
      const tx: FinancialTransaction = {
        id: crypto.randomUUID(),
        description: observation ? `${desc} (${observation})` : desc,
        type: 'INCOME', category: 'TUITION', amount, date: receiptDate, dueDate,
        status: 'PAID', relatedEntity: receiveItem.student.name,
        paymentMethod: paymentMethod as any, ...installmentFields,
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

  /** Schedule deletion with undo window */
  const scheduleDelete = (label: string, transactionIds: string[]) => {
    const toastId  = crypto.randomUUID();
    const timeoutId = setTimeout(async () => {
      try {
        await Promise.all(transactionIds.map(id => deleteTransaction(id)));
        setPendingDeletes(prev => prev.filter(pd => pd.toastId !== toastId));
        await loadData();
      } catch {
        // On failure restore the item by removing from pending
        setPendingDeletes(prev => prev.filter(pd => pd.toastId !== toastId));
        alert('Erro ao excluir. Tente novamente.');
      }
    }, UNDO_DELAY_MS);

    setPendingDeletes(prev => [...prev, { toastId, label, transactionIds, timeoutId }]);
  };

  const handleDeleteSingle = (item: any) => {
    if (!item.transaction) return;
    scheduleDelete(`Mensalidade de ${item.student.name}`, [item.transaction.id]);
  };

  const handleDeleteSelected = async () => {
    const toDelete = filtered.filter(i => selectedIds.has(i.student.id) && i.transaction);
    if (toDelete.length === 0) return;
    const label = toDelete.length === 1
      ? `Mensalidade de ${toDelete[0].student.name}`
      : `${toDelete.length} mensalidades`;
    scheduleDelete(label, toDelete.map(i => i.transaction.id));
    setSelectedIds(new Set());
    setCheckboxMode(false);
  };

  const handleUndoDelete = (toastId: string) => {
    setPendingDeletes(prev => {
      const entry = prev.find(pd => pd.toastId === toastId);
      if (entry) clearTimeout(entry.timeoutId);
      return prev.filter(pd => pd.toastId !== toastId);
    });
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
        <p className="text-slate-500 text-sm">Recebimento de mensalidades</p>
      </div>

      {/* Month navigator */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="text-center">
          <p className="font-bold text-slate-800 text-lg capitalize">{monthName}</p>
          {isFutureMonth
            ? <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-0.5"><Info size={11} /> Mês futuro — lançamento antecipado</span>
            : <p className="text-xs text-slate-400 mt-0.5">Referência de mensalidades</p>}
        </div>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Status counters */}
      <div className="grid grid-cols-3 gap-3">
        {([
          { key: 'PAID',    count: counts.paid,    label: '✅ Pagos',     actCls: 'bg-green-600 border-green-600',   inaCls: 'bg-white border-slate-200 hover:border-green-300 hover:bg-green-50',   numCls: 'text-green-600' },
          { key: 'PENDING', count: counts.pending, label: '⚠️ Pendentes', actCls: 'bg-yellow-500 border-yellow-500', inaCls: 'bg-white border-slate-200 hover:border-yellow-300 hover:bg-yellow-50', numCls: 'text-yellow-600' },
          { key: 'LATE',    count: counts.late,    label: '🔴 Atrasados', actCls: 'bg-red-600 border-red-600',       inaCls: 'bg-white border-slate-200 hover:border-red-300 hover:bg-red-50',       numCls: 'text-red-600' },
        ] as const).map(s => {
          const active = statusFilter === s.key;
          return (
            <button key={s.key} onClick={() => setStatusFilter(active ? 'all' : s.key)}
              className={`p-4 rounded-xl border text-center transition-all ${active ? s.actCls + ' text-white shadow-md' : s.inaCls}`}>
              <p className={`text-2xl font-bold ${active ? 'text-white' : s.numCls}`}>{s.count}</p>
              <p className={`text-xs font-medium mt-1 ${active ? 'text-white/80' : 'text-slate-500'}`}>{s.label}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder="Buscar aluno..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-9 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white" />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">

                {/* Master checkbox — always visible, activates row checkboxes */}
                <th className="pl-4 pr-2 py-3 w-10">
                  <input
                    ref={masterCheckboxRef}
                    type="checkbox"
                    checked={checkboxMode && allSelected}
                    onChange={handleMasterCheckbox}
                    className="w-4 h-4 rounded border-slate-300 accent-primary-600 cursor-pointer"
                    title={!checkboxMode ? 'Ativar seleção em massa' : allSelected ? 'Desmarcar tudo' : 'Selecionar todos'}
                  />
                </th>

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
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
                    Nenhum aluno encontrado para este filtro.
                  </td>
                </tr>
              )}
              {filtered.map((item: any) => {
                const isSelected  = checkboxMode && selectedIds.has(item.student.id);
                const canSelect   = checkboxMode && !!item.transaction && item.status !== 'PAID';
                return (
                  <tr key={item.student.id}
                    className={`transition-colors ${
                      isSelected                ? 'bg-primary-50/70' :
                      item.status === 'LATE'    ? 'bg-red-50/40 hover:bg-red-50/70' :
                      item.status === 'PENDING' ? 'hover:bg-yellow-50/40' :
                                                 'hover:bg-green-50/20'
                    }`}>

                    {/* Row checkbox — only visible in checkbox mode */}
                    <td className="pl-4 pr-2 py-3 w-10">
                      {canSelect ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.student.id)}
                          className="w-4 h-4 rounded border-slate-300 accent-primary-600 cursor-pointer"
                        />
                      ) : (
                        <span className="block w-4 h-4" />
                      )}
                    </td>

                    <td className="px-5 py-3 font-medium text-slate-800 text-sm">{item.student.name}</td>

                    <td className="px-5 py-3">
                      <div className="text-sm text-slate-700">{item.planLabel || 'Sem Plano'}</div>
                      {item.planFrequency && (
                        <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium ${FREQ_COLOR[item.planFrequency] || 'bg-slate-100 text-slate-500'}`}>
                          {item.planFrequency}
                        </span>
                      )}
                      {item.isParcelado && (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-50 text-indigo-700">
                          {item.paidInstallments}ª/{item.installTotal} parcela
                        </span>
                      )}
                      {item.isParcelado && item.paidInstallments >= item.installTotal - 1 && (
                        <span className="text-xs text-amber-600 font-medium block mt-0.5">🔔 Renovação</span>
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

                    {/* Ação: Receber + Excluir (lado a lado) */}
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.status !== 'PAID' && (
                          <button onClick={() => openReceiveModal(item)}
                            className="px-4 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
                            Receber
                          </button>
                        )}
                        {item.transaction && item.status !== 'PAID' && (
                          <button onClick={() => handleDeleteSingle(item)}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title="Excluir mensalidade">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 text-xs text-slate-400 text-right">
            {filtered.length} aluno{filtered.length !== 1 ? 's' : ''}
            {selectableItems.length > 0 && <> · {selectableItems.length} com registro</>}
          </div>
        )}
      </div>

      {/* ── Barra de exclusão em massa (aparece quando checkboxMode + itens selecionados) ── */}
      {checkboxMode && selectedCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3
          bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl shadow-slate-900/40
          animate-in slide-in-from-bottom-3 duration-200">
          <span className="text-sm font-medium">
            {selectedCount} mensalidade{selectedCount > 1 ? 's' : ''} selecionada{selectedCount > 1 ? 's' : ''}
          </span>
          <div className="w-px h-5 bg-white/20" />
          <button onClick={() => { setSelectedIds(new Set()); setCheckboxMode(false); }}
            className="text-xs text-slate-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <button onClick={handleDeleteSelected} disabled={deleting}
            className="flex items-center gap-2 px-4 py-1.5 bg-red-500 hover:bg-red-400 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-colors">
            {deleting
              ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <Trash2 size={14} />}
            Excluir{selectedCount > 1 ? ` (${selectedCount})` : ''}
          </button>
        </div>
      )}

      {/* ── Toasts de undo (aparecem no canto inferior direito) ── */}
      {pendingDeletes.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm">
          {pendingDeletes.map(pd => (
            <div key={pd.toastId}
              className="flex items-center gap-3 bg-slate-800 text-white pl-4 pr-3 py-3 rounded-xl shadow-2xl text-sm
                animate-in slide-in-from-right-3 duration-200">
              <Trash2 size={14} className="text-red-400 shrink-0" />
              <span className="flex-1 text-slate-200 text-xs leading-snug">
                <strong className="text-white">{pd.label}</strong> excluída{pd.transactionIds.length > 1 ? 's' : ''}
              </span>
              <button onClick={() => handleUndoDelete(pd.toastId)}
                className="text-xs font-bold text-primary-300 hover:text-primary-200 underline shrink-0 transition-colors">
                Desfazer
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal de recebimento ────────────────────────────────────────────── */}
      {receiveItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">

            <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-lg leading-tight">Receber Mensalidade</h3>
                <p className="text-sm text-slate-500 capitalize mt-0.5">{monthName}</p>
              </div>
              <button onClick={() => setReceiveItem(null)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">

              {/* Student info */}
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
                {receiveItem.freqMonths > 1 && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
                    <Info size={12} />
                    Cobre o período: <strong>{getPeriodLabel(selYear, selMonth, receiveItem.freqMonths)}</strong>
                  </div>
                )}
              </div>

              {/* Payment mode toggle */}
              {receiveItem.freqMonths > 1 && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Modalidade de Pagamento</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['PARCELADO', 'AVISTA'] as const).map(mode => (
                      <button key={mode} onClick={() => setPaymentMode(mode)}
                        className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                          paymentMode === mode ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}>
                        {mode === 'PARCELADO' ? <>📅 Parcelado {receiveItem.installTotal}x<div className="text-xs font-normal mt-0.5 opacity-70">1 pagamento por mês</div></> : <>💰 À Vista<div className="text-xs font-normal mt-0.5 opacity-70">Cobre {receiveItem.freqMonths} meses</div></>}
                      </button>
                    ))}
                  </div>
                  {paymentMode === 'PARCELADO' && receiveItem.freqMonths > 1 && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                      <Info size={12} />
                      Parcela <strong>{receiveItem.nextInstallment}ª de {receiveItem.installTotal}</strong>
                      {receiveItem.paidInstallments > 0 && ` — ${receiveItem.paidInstallments} já paga${receiveItem.paidInstallments > 1 ? 's' : ''}`}
                    </div>
                  )}
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Valor a Receber</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-semibold text-sm">R$</span>
                  <input type="text" value={customAmount}
                    onChange={e => setCustomAmount(e.target.value.replace(/[^0-9,]/g, ''))}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl text-xl font-bold text-slate-800 focus:ring-2 focus:ring-primary-500 outline-none text-center" />
                </div>
              </div>

              {/* Payment method */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Forma de Pagamento</label>
                <div className="grid grid-cols-4 gap-2">
                  {PAYMENT_METHODS.map(pm => (
                    <button key={pm.id} onClick={() => setPaymentMethod(pm.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                        paymentMethod === pm.id ? 'border-primary-500 bg-primary-50 shadow-sm' : 'border-slate-200 hover:border-primary-300 hover:bg-slate-50'
                      }`}>
                      <span className="text-2xl leading-none">{pm.emoji}</span>
                      <span className={`text-xs font-semibold text-center leading-tight ${paymentMethod === pm.id ? 'text-primary-700' : 'text-slate-600'}`}>{pm.label}</span>
                    </button>
                  ))}
                </div>
                {!paymentMethod && <p className="text-xs text-slate-400 mt-2">Selecione a forma de pagamento para continuar</p>}
              </div>

              {/* Date + observation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Data de Recebimento</label>
                  <input type="date" value={receiptDate} onChange={e => setReceiptDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Observação <span className="font-normal text-slate-400">(opcional)</span>
                  </label>
                  <input type="text" value={observation} onChange={e => setObservation(e.target.value)}
                    placeholder="Ex: Desconto aplicado"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button onClick={() => setReceiveItem(null)}
                className="flex-1 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm">
                Cancelar
              </button>
              <button onClick={handleConfirmReceive} disabled={!paymentMethod || saving}
                className="flex-[2] py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-100">
                {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle size={18} />}
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
