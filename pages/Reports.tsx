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
import { fetchStudents, fetchTransactions } from '../services/api';

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

  const fetchReportData = async (reportId: string) => {
    switch (reportId) {
      case 'acad_alunos_ativos': {
        const students = await fetchStudents();
        const active = students.filter(s => s.status === 'Ativo');
        return {
          headers: ['Nome', 'Telefone', 'Plano', 'Data Início'],
          data: active.map(s => ([
            s.name,
            s.phone || '-',
            s.plan || '-',
            s.enrollmentDate ? new Date(s.enrollmentDate).toLocaleDateString() : '-'
          ]))
        };
      }
      case 'acad_aniversariantes': {
        const students = await fetchStudents();
        const start = new Date(dateRange.start + 'T00:00:00'); // Force start of day in local time
        const end = new Date(dateRange.end + 'T23:59:59');     // Force end of day in local time

        // Filter: check if birthday (month/day) falls in range
        const birthdays = students.filter(s => {
          if (!s.birthDate) return false;

          let bdate: Date;
          if (s.birthDate.includes('T')) {
            bdate = new Date(s.birthDate);
          } else if (s.birthDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            // Handle YYYY-MM-DD explicitly as local time to avoid timezone shift
            const [y, m, d] = s.birthDate.split('-').map(Number);
            bdate = new Date(y, m - 1, d);
          } else {
            return false; // Unknown format
          }

          // Check if valid date
          if (isNaN(bdate.getTime())) return false;
          // If year is invalid (e.g. year 1), treat as invalid
          if (bdate.getFullYear() < 1900) return false;

          // Normalize birthday to this year for comparison
          const thisYear = new Date().getFullYear();
          const thisYearBday = new Date(thisYear, bdate.getMonth(), bdate.getDate());

          // Handle range spanning across years (e.g. Dec to Jan)
          // For simplicity in this specific report logical, we assume range is within a year or handled linearly
          // But strict comparison:
          return thisYearBday >= start && thisYearBday <= end;
        });

        return {
          headers: ['Nome', 'Data Nascimento', 'Idade', 'Telefone', 'Status'],
          data: birthdays.map(s => {
            if (!s.birthDate) {
              return [s.name, 'Sem data preenchida', '-', s.phone || '-', s.status];
            }

            let bdate: Date;
            // Robust parsing
            if (s.birthDate.includes('T')) {
              bdate = new Date(s.birthDate);
            } else {
              const [y, m, d] = s.birthDate.split('-').map(Number);
              bdate = new Date(y, m - 1, d);
            }

            // Check for invalid years (like year 1)
            if (bdate.getFullYear() < 1900) {
              return [s.name, 'Sem data preenchida', '-', s.phone || '-', s.status];
            }

            const today = new Date();
            let age = today.getFullYear() - bdate.getFullYear();
            const m = today.getMonth() - bdate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < bdate.getDate())) {
              age--;
            }

            return [
              s.name,
              bdate.toLocaleDateString(),
              age.toString() + ' anos',
              s.phone || '-',
              s.status
            ];
          })
        };
      }
      case 'fin_receita': {
        const trans = await fetchTransactions();
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const filtered = trans.filter(t => {
          if (t.type !== 'INCOME') return false;
          let tDate;
          if (t.date.includes('T')) tDate = new Date(t.date);
          else {
            const [y, m, d] = t.date.split('-').map(Number);
            tDate = new Date(y, m - 1, d);
          }
          return tDate >= start && tDate <= end;
        });

        return {
          headers: ['Data', 'Descrição', 'Categoria', 'Valor', 'Status'],
          data: filtered.map(t => ([
            t.date,
            t.description,
            t.category,
            `R$ ${Number(t.amount).toFixed(2)}`,
            t.status === 'PAID' ? 'Pago' : t.status
          ]))
        };
      }
      // Implement others or default
      default:
        return {
          headers: ['Mensagem'],
          data: [['Relatório ainda não implementado (Mock)']]
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
              {/* Mock Table Render */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    {Object.keys(reportResult.data[0] || {}).map((header) => (
                      <th key={header} className="p-3 text-xs font-bold text-slate-600 uppercase border-b border-slate-200">{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportResult.data.map((row: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                      {Object.values(row).map((val: any, vIdx: number) => (
                        <td key={vIdx} className="p-3 text-sm text-slate-700">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
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