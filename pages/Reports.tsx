import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FileBarChart,
  DollarSign,
  Users,
  Calendar,
  TrendingDown,
  Download,
  FileType,
  CheckCircle,
  Loader2,
  X,
  Cake,
  Eye,
  Printer
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { fetchStudents, fetchTransactions, fetchPlans, fetchClasses } from '../services/api';

interface ReportDef {
  id: string;
  title: string;
  description: string;
  category: 'Financeiro' | 'Acadêmico' | 'Operacional';
  icon: React.ElementType;
  color: string;
}

const reports: ReportDef[] = [
  // Financeiro
  {
    id: 'fin_receita',
    title: 'Receita Detalhada',
    description: 'Entradas, saídas e fluxo de caixa por período.',
    category: 'Financeiro',
    icon: DollarSign,
    color: 'text-green-600 bg-green-50'
  },
  {
    id: 'fin_inadimplencia',
    title: 'Relatório de Inadimplência',
    description: 'Lista de alunos com pagamentos pendentes ou atrasados.',
    category: 'Financeiro',
    icon: TrendingDown,
    color: 'text-red-600 bg-red-50'
  },
  {
    id: 'fin_mensalidades',
    title: 'Pagamentos do Mês',
    description: 'Status de todas as mensalidades geradas no mês atual.',
    category: 'Financeiro',
    icon: FileBarChart,
    color: 'text-teal-600 bg-teal-50'
  },

  // Acadêmico
  {
    id: 'acad_alunos_ativos',
    title: 'Alunos Ativos',
    description: 'Lista completa de alunos matriculados e ativos.',
    category: 'Acadêmico',
    icon: Users,
    color: 'text-blue-600 bg-blue-50'
  },
  {
    id: 'acad_novas_matriculas',
    title: 'Novas Matrículas',
    description: 'Alunos que ingressaram no período selecionado.',
    category: 'Acadêmico',
    icon: CheckCircle,
    color: 'text-indigo-600 bg-indigo-50'
  },
  {
    id: 'acad_cancelamentos',
    title: 'Taxa de Cancelamento',
    description: 'Alunos que inativaram ou trancaram a matrícula.',
    category: 'Acadêmico',
    icon: Users,
    color: 'text-orange-600 bg-orange-50'
  },
  {
    id: 'acad_aniversariantes',
    title: 'Aniversariantes',
    description: 'Lista de alunos que fazem aniversário no período.',
    category: 'Acadêmico',
    icon: Cake,
    color: 'text-pink-600 bg-pink-50'
  },

  // Operacional
  {
    id: 'op_frequencia',
    title: 'Relatório de Frequência',
    description: 'Taxa de presença por turma e por aluno.',
    category: 'Operacional',
    icon: Calendar,
    color: 'text-purple-600 bg-purple-50'
  },
  {
    id: 'op_ocupacao',
    title: 'Ocupação de Turmas',
    description: 'Vagas disponíveis vs. preenchidas por horário.',
    category: 'Operacional',
    icon: Users,
    color: 'text-slate-600 bg-slate-100'
  },
];



const Reports: React.FC = () => {
  const location = useLocation();
  const [selectedReport, setSelectedReport] = useState<ReportDef | null>(null);

  useEffect(() => {
    if (location.state?.openReport) {
      const reportToOpen = reports.find(r => r.id === location.state.openReport);
      if (reportToOpen) {
        setSelectedReport(reportToOpen);
        // Optional: clear state to prevent reopening on refresh? 
        // Actually refresh clears state usually, but navigating back might re-trigger. 
        // Ideally we consume it. But useEffect dependency array [] handles mount only.
      }
    }
  }, [location.state]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [format, setFormat] = useState<'PDF' | 'SCREEN'>('SCREEN');
  const [reportResult, setReportResult] = useState<any>(null);
  const [dateRange, setDateRange] = useState({ start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] });
  const [birthdaySortBy, setBirthdaySortBy] = useState<'dia_mes' | 'nome' | 'idade_asc' | 'idade_desc' | 'data'>('dia_mes');

  const fetchReportData = async (reportId: string) => {
    // --- Helpers ---
    const CATEGORY_LABELS: Record<string, string> = {
      TUITION: 'Mensalidade', SALARY: 'Salário', MAINTENANCE: 'Manutenção',
      RENT: 'Aluguel', EQUIPMENT: 'Equipamento', REGISTRATION: 'Matrícula', OTHER: 'Outro',
    };
    const STATUS_LABELS: Record<string, string> = {
      PAID: 'Pago', PENDING: 'Pendente', LATE: 'Atrasado', CANCELLED: 'Cancelado',
    };
    const PM_LABELS: Record<string, string> = {
      DINHEIRO: 'Dinheiro', PIX: 'Pix', DEBITO: 'Débito', CREDITO: 'Crédito', CHEQUE: 'Cheque',
    };
    const FREQ_MONTHS: Record<string, number> = {
      Mensal: 1, Bimestral: 2, Trimestral: 3, Semestral: 6, Anual: 12,
    };
    const fmtDate = (dateStr: string) => {
      if (!dateStr) return '-';
      let d: Date;
      if (dateStr.includes('T')) d = new Date(dateStr);
      else { const [y, m, day] = dateStr.split('-').map(Number); d = new Date(y, m - 1, day); }
      return isNaN(d.getTime()) ? '-' : d.toLocaleDateString('pt-BR');
    };
    const fmtMoney = (v: number) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;
    const parseDateLocal = (s: string): Date => {
      if (s.includes('T')) return new Date(s);
      const [y, m, d] = s.split('-').map(Number);
      return new Date(y, m - 1, d);
    };

    const rangeStart = parseDateLocal(dateRange.start);
    const rangeEnd = parseDateLocal(dateRange.end);
    rangeStart.setHours(0, 0, 0, 0);
    rangeEnd.setHours(23, 59, 59, 999);

    // Reference month = start date's month
    const refYear = rangeStart.getFullYear();
    const refMonth = rangeStart.getMonth(); // 0-indexed

    switch (reportId) {

      // ── FINANCEIRO ──────────────────────────────────────────────
      case 'fin_receita': {
        const trans = await fetchTransactions();
        const filtered = trans.filter(t => {
          const d = parseDateLocal(t.date);
          return d >= rangeStart && d <= rangeEnd;
        }).sort((a, b) => parseDateLocal(a.date).getTime() - parseDateLocal(b.date).getTime());

        const totalIncome = filtered.filter(t => t.type === 'INCOME').reduce((s, t) => s + Number(t.amount), 0);
        const totalExpense = filtered.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + Number(t.amount), 0);

        const rows = filtered.map(t => ([
          fmtDate(t.date),
          t.description,
          CATEGORY_LABELS[t.category] ?? t.category,
          t.type === 'INCOME' ? 'Entrada' : 'Saída',
          fmtMoney(Number(t.amount)),
          STATUS_LABELS[t.status] ?? t.status,
          t.paymentMethod ? (PM_LABELS[t.paymentMethod] ?? t.paymentMethod) : '-',
        ]));

        // Summary footer
        rows.push(['', '', '', 'Total Entradas', fmtMoney(totalIncome), '', '']);
        rows.push(['', '', '', 'Total Saídas', fmtMoney(totalExpense), '', '']);
        rows.push(['', '', '', 'Saldo', fmtMoney(totalIncome - totalExpense), '', '']);

        return {
          headers: ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Status', 'Pagamento'],
          data: rows,
        };
      }

      case 'fin_inadimplencia': {
        const [students, trans, plans] = await Promise.all([fetchStudents(), fetchTransactions(), fetchPlans()]);
        const active = students.filter(s => s.status === 'Ativo');

        const planMapByName: Record<string, any> = {};
        const planMapById: Record<string, any> = {};
        plans.forEach((p: any) => { 
          planMapByName[p.name] = p;
          planMapById[p.id.toString()] = p;
        });

        const delinquent = active.filter(s => {
          const studentPlans = Array.isArray(s.plans) && s.plans.length > 0 ? s.plans : (s.plan ? [s.plan] : []);
          const studentPlanIds = Array.isArray(s.planIds) && s.planIds.length > 0 ? s.planIds : studentPlans;
          if (studentPlanIds.length === 0) return false;
          // Check if any plan covers this month via a paid transaction
          return studentPlanIds.every(planIdOrName => {
            const plan = planMapById[planIdOrName] || planMapByName[planIdOrName];
            const freqMonths = plan ? (FREQ_MONTHS[plan.frequency] ?? 1) : 1;
            const hasPaid = trans.some(t => {
              if (t.type !== 'INCOME') return false;
              if (t.status !== 'PAID') return false;
              if (t.relatedEntity !== s.name) return false;
              const tDate = parseDateLocal(t.date);
              const tYear = tDate.getFullYear();
              const tMonth = tDate.getMonth();
              const diff = (refYear - tYear) * 12 + (refMonth - tMonth);
              return diff >= 0 && diff < freqMonths;
            });
            return !hasPaid;
          });
        });

        return {
          headers: ['Nome', 'Telefone', 'Plano', 'Status Pgto', 'Desde'],
          data: delinquent.map(s => ([
            s.name,
            s.phone || '-',
            Array.isArray(s.plans) && s.plans.length > 0 ? s.plans.join(', ') : (s.plan || '-'),
            s.paymentStatus,
            fmtDate(s.enrollmentDate),
          ])),
        };
      }

      case 'fin_mensalidades': {
        const [students, trans, plans] = await Promise.all([fetchStudents(), fetchTransactions(), fetchPlans()]);
        const active = students.filter(s => s.status === 'Ativo');

        const planMapByName: Record<string, any> = {};
        const planMapById: Record<string, any> = {};
        plans.forEach((p: any) => { 
          planMapByName[p.name] = p;
          planMapById[p.id.toString()] = p;
        });

        const today = new Date();
        const isPast = refYear < today.getFullYear() || (refYear === today.getFullYear() && refMonth < today.getMonth());

        const rows = active.map(s => {
          const studentPlans = Array.isArray(s.plans) && s.plans.length > 0 ? s.plans : (s.plan ? [s.plan] : []);
          const studentPlanIds = Array.isArray(s.planIds) && s.planIds.length > 0 ? s.planIds : studentPlans;
          const planName = studentPlans[0] || '-';
          const planIdOrName = studentPlanIds[0] || '-';
          const plan = planMapById[planIdOrName] || planMapByName[planIdOrName];
          const freqMonths = plan ? (FREQ_MONTHS[plan.frequency] ?? 1) : 1;
          const planPrice = plan ? fmtMoney(plan.price) : '-';

          const paidTx = trans.find(t => {
            if (t.type !== 'INCOME' || t.status !== 'PAID' || t.relatedEntity !== s.name) return false;
            const tDate = parseDateLocal(t.date);
            const diff = (refYear - tDate.getFullYear()) * 12 + (refMonth - tDate.getMonth());
            return diff >= 0 && diff < freqMonths;
          });

          let statusLabel: string;
          if (paidTx) statusLabel = 'Pago';
          else if (isPast) statusLabel = 'Atrasado';
          else statusLabel = 'Pendente';

          return [
            s.name,
            planName,
            plan?.frequency ?? '-',
            planPrice,
            statusLabel,
            paidTx ? fmtDate(paidTx.date) : '-',
            paidTx?.paymentMethod ? (PM_LABELS[paidTx.paymentMethod] ?? paidTx.paymentMethod) : '-',
          ];
        });

        const paid = rows.filter(r => r[4] === 'Pago').length;
        const pending = rows.filter(r => r[4] === 'Pendente').length;
        const late = rows.filter(r => r[4] === 'Atrasado').length;
        rows.push(['', `Pagos: ${paid}`, `Pendentes: ${pending}`, `Atrasados: ${late}`, '', '', '']);

        return {
          headers: ['Nome', 'Plano', 'Periodicidade', 'Valor', 'Status', 'Data Pgto', 'Forma'],
          data: rows,
        };
      }

      // ── ACADÊMICO ─────────────────────────────────────────────────
      case 'acad_alunos_ativos': {
        const students = await fetchStudents();
        const active = students.filter(s => s.status === 'Ativo')
          .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        return {
          headers: ['Nome', 'Modalidades', 'Plano', 'Telefone', 'Data Matrícula'],
          data: active.map(s => ([
            s.name,
            Array.isArray(s.modalities) && s.modalities.length > 0 ? s.modalities.join(', ') : '-',
            Array.isArray(s.plans) && s.plans.length > 0 ? s.plans.join(', ') : (s.plan || '-'),
            s.phone || '-',
            fmtDate(s.enrollmentDate),
          ])),
        };
      }

      case 'acad_novas_matriculas': {
        const students = await fetchStudents();
        const newStudents = students.filter(s => {
          if (!s.enrollmentDate) return false;
          const d = parseDateLocal(s.enrollmentDate);
          return d >= rangeStart && d <= rangeEnd;
        }).sort((a, b) => parseDateLocal(a.enrollmentDate).getTime() - parseDateLocal(b.enrollmentDate).getTime());
        return {
          headers: ['Nome', 'Data Matrícula', 'Plano', 'Modalidades', 'Telefone'],
          data: newStudents.map(s => ([
            s.name,
            fmtDate(s.enrollmentDate),
            Array.isArray(s.plans) && s.plans.length > 0 ? s.plans.join(', ') : (s.plan || '-'),
            Array.isArray(s.modalities) && s.modalities.length > 0 ? s.modalities.join(', ') : '-',
            s.phone || '-',
          ])),
        };
      }

      case 'acad_cancelamentos': {
        const students = await fetchStudents();
        const inactive = students.filter(s => s.status === 'Inativo' || s.status === 'Trancado')
          .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        return {
          headers: ['Nome', 'Status', 'Plano', 'Modalidades', 'Telefone'],
          data: inactive.map(s => ([
            s.name,
            s.status,
            Array.isArray(s.plans) && s.plans.length > 0 ? s.plans.join(', ') : (s.plan || '-'),
            Array.isArray(s.modalities) && s.modalities.length > 0 ? s.modalities.join(', ') : '-',
            s.phone || '-',
          ])),
        };
      }

      case 'acad_aniversariantes': {
        const students = await fetchStudents();
        const start = new Date(dateRange.start + 'T00:00:00');
        const end = new Date(dateRange.end + 'T23:59:59');

        const parseBirthDate = (s: any): Date | null => {
          if (!s.birthDate) return null;
          const bdate = parseDateLocal(s.birthDate);
          if (isNaN(bdate.getTime()) || bdate.getFullYear() < 1900) return null;
          return bdate;
        };

        const birthdays = students.filter(s => {
          const bdate = parseBirthDate(s);
          if (!bdate) return false;
          const thisYear = new Date().getFullYear();
          const thisYearBday = new Date(thisYear, bdate.getMonth(), bdate.getDate());
          return thisYearBday >= start && thisYearBday <= end;
        });

        const sortedBirthdays = [...birthdays].sort((a, b) => {
          const da = parseBirthDate(a);
          const db = parseBirthDate(b);
          if (!da && !db) return 0;
          if (!da) return 1;
          if (!db) return -1;
          switch (birthdaySortBy) {
            case 'nome': return a.name.localeCompare(b.name, 'pt-BR');
            case 'idade_asc': return db.getFullYear() - da.getFullYear();
            case 'idade_desc': return da.getFullYear() - db.getFullYear();
            case 'data':
            case 'dia_mes':
            default:
              if (da.getMonth() !== db.getMonth()) return da.getMonth() - db.getMonth();
              return da.getDate() - db.getDate();
          }
        });

        return {
          headers: ['Nome', 'Data Nascimento', 'Idade', 'Telefone', 'Status'],
          data: sortedBirthdays.map(s => {
            const bdate = parseBirthDate(s);
            if (!bdate) return [s.name, 'Sem data', '-', s.phone || '-', s.status];
            const today = new Date();
            let age = today.getFullYear() - bdate.getFullYear();
            const mDiff = today.getMonth() - bdate.getMonth();
            if (mDiff < 0 || (mDiff === 0 && today.getDate() < bdate.getDate())) age--;
            return [s.name, fmtDate(s.birthDate), age + ' anos', s.phone || '-', s.status];
          }),
        };
      }

      // ── OPERACIONAL ───────────────────────────────────────────────
      case 'op_ocupacao': {
        const classes = await fetchClasses();
        return {
          headers: ['Turma', 'Horário', 'Dias', 'Instrutor', 'Inscritos', 'Vagas', 'Ocupação', 'Status'],
          data: classes.map((c: any) => {
            const pct = c.capacity > 0 ? Math.round((c.enrolled / c.capacity) * 100) : 0;
            return [
              c.name,
              `${c.time} – ${c.endTime}`,
              Array.isArray(c.days) ? c.days.join(', ') : c.days,
              c.instructor,
              String(c.enrolled),
              String(c.capacity),
              `${pct}%`,
              c.status === 'Full' ? 'Lotado' : c.status === 'Cancelled' ? 'Cancelado' : 'Aberto',
            ];
          }),
        };
      }

      case 'op_frequencia': {
        return {
          headers: ['Informação'],
          data: [['Módulo de frequência ainda não implementado. Os dados de presença por aluno serão disponibilizados em versão futura.']],
        };
      }

      default:
        return {
          headers: ['Mensagem'],
          data: [['Relatório desconhecido.']],
        };
    }
  };

  const handleGenerate = async () => {
    if (!selectedReport) return;
    setIsGenerating(true);

    try {
      const reportData = await fetchReportData(selectedReport.id);

      if (format === 'SCREEN') {
        // Convert to array of objects for display logic if needed or keep raw
        const tableData = reportData.data.map((row: any[]) => {
          const obj: any = {};
          reportData.headers.forEach((h: string, i: number) => {
            obj[h] = row[i];
          });
          return obj;
        });

        setReportResult({
          title: selectedReport.title,
          period: `${new Date(dateRange.start).toLocaleDateString()} a ${new Date(dateRange.end).toLocaleDateString()}`,
          data: tableData,
          headers: reportData.headers // Store specific headers for ordering
        });

      } else if (format === 'PDF') {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(selectedReport.title, 14, 22);

        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Período: ${new Date(dateRange.start).toLocaleDateString()} a ${new Date(dateRange.end).toLocaleDateString()}`, 14, 30);

        if (selectedReport.description) {
          doc.setFontSize(10);
          doc.text(selectedReport.description, 14, 36);
        }

        autoTable(doc, {
          head: [reportData.headers],
          body: reportData.data,
          startY: 44,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 245, 245] }
        });

        doc.save(`${selectedReport.id}_${dateRange.start}.pdf`);
      }

    } catch (e: any) {
      console.error("Erro gerando relatório", e);
      alert("Erro ao gerar relatório: " + e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const closeReportModal = () => {
    setSelectedReport(null);
    setReportResult(null);
    setFormat('SCREEN');
  };

  const renderCategory = (category: string) => (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-slate-700 mb-4 border-l-4 border-primary-500 pl-3">
        {category}
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.filter(r => r.category === category).map(report => (
          <button
            key={report.id}
            onClick={() => setSelectedReport(report)}
            className="flex flex-col items-start p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:border-primary-300 transition-all text-left group h-full"
          >
            <div className={`p-3 rounded-lg mb-3 ${report.color}`}>
              <report.icon size={24} />
            </div>
            <h4 className="font-bold text-slate-800 mb-1 group-hover:text-primary-700 transition-colors">
              {report.title}
            </h4>
            <p className="text-sm text-slate-500">
              {report.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Relatórios Gerenciais</h2>
        <p className="text-slate-500 text-sm">Extraia dados detalhados para tomada de decisão.</p>
      </div>

      <div className="space-y-8">
        {renderCategory('Financeiro')}
        {renderCategory('Acadêmico')}
        {renderCategory('Operacional')}
      </div>

      {/* Configuration Modal */}
      {selectedReport && !reportResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${selectedReport.color}`}>
                  <selectedReport.icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Gerar Relatório</h3>
              </div>
              <button onClick={closeReportModal} className="text-slate-400 hover:text-red-500">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <p className="font-medium text-slate-800">{selectedReport.title}</p>
                <p className="text-xs text-slate-500 mt-1">{selectedReport.description}</p>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Período de Análise</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs text-slate-500 mb-1 block">Início</span>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 mb-1 block">Fim</span>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {selectedReport.id === 'acad_aniversariantes' && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-slate-700">Ordenação</label>
                  <select
                    value={birthdaySortBy}
                    onChange={e => setBirthdaySortBy(e.target.value as typeof birthdaySortBy)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                  >
                    <option value="dia_mes">Dia do aniversário</option>
                    <option value="nome">Nome (A-Z)</option>
                    <option value="idade_asc">Idade (mais novo primeiro)</option>
                    <option value="idade_desc">Idade (mais velho primeiro)</option>
                    <option value="data">Data completa (mês/dia)</option>
                  </select>
                </div>
              )}

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Formato de Saída</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormat('SCREEN')}
                    className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${format === 'SCREEN'
                      ? 'bg-primary-50 border-primary-500 text-primary-700 ring-1 ring-primary-500'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                  >
                    <Eye size={20} className="mb-1" />
                    <span className="text-xs font-bold">Exibir na Tela</span>
                  </button>
                  <button
                    onClick={() => setFormat('PDF')}
                    className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${format === 'PDF'
                      ? 'bg-primary-50 border-primary-500 text-primary-700 ring-1 ring-primary-500'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                  >
                    <FileType size={20} className="mb-1" />
                    <span className="text-xs font-bold">Gerar PDF</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={closeReportModal}
                className="px-4 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors"
                disabled={isGenerating}
              >
                Cancelar
              </button>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-6 py-2.5 bg-slate-800 text-white font-bold rounded-lg hover:bg-slate-900 shadow-lg flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait min-w-[140px] justify-center"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Processando...
                  </>
                ) : (
                  <>
                    {format === 'SCREEN' ? <Eye size={18} /> : <Download size={18} />}
                    {format === 'SCREEN' ? 'Visualizar' : 'Baixar'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screen Result Modal */}
      {selectedReport && reportResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <div>
                <h3 className="text-xl font-bold text-slate-800">{reportResult.title}</h3>
                <p className="text-sm text-slate-500">Período: {reportResult.period}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => window.print()} className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-lg" title="Imprimir">
                  <Printer size={20} />
                </button>
                <button onClick={closeReportModal} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-auto">
              {reportResult.data.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-lg font-medium">Nenhum resultado encontrado</p>
                  <p className="text-sm mt-1">Tente ajustar o período de análise.</p>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      {(reportResult.headers as string[]).map((header: string) => (
                        <th key={header} className="p-3 text-xs font-bold text-slate-600 uppercase border-b border-slate-200 whitespace-nowrap">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportResult.data.map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        {(reportResult.headers as string[]).map((h: string, vIdx: number) => (
                          <td key={vIdx} className="p-3 text-slate-700">{row[h]}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end">
              <button onClick={closeReportModal} className="px-6 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 font-medium">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;