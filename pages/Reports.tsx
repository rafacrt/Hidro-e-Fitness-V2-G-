import React, { useState } from 'react';
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
  X
} from 'lucide-react';

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
    icon: Users, // Using Users as generic placeholder if UserMinus unavailable
    color: 'text-orange-600 bg-orange-50'
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
  const [selectedReport, setSelectedReport] = useState<ReportDef | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [format, setFormat] = useState<'PDF' | 'EXCEL' | 'CSV'>('PDF');

  const handleGenerate = () => {
    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      setIsGenerating(false);
      alert(`Relatório "${selectedReport?.title}" gerado com sucesso em ${format}!`);
      setSelectedReport(null);
    }, 2000);
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
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${selectedReport.color}`}>
                   <selectedReport.icon size={20} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Gerar Relatório</h3>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-slate-400 hover:text-red-500">
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
                    <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 mb-1 block">Fim</span>
                    <input type="date" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">Formato de Saída</label>
                <div className="grid grid-cols-3 gap-3">
                  {['PDF', 'EXCEL', 'CSV'].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setFormat(fmt as any)}
                      className={`flex flex-col items-center justify-center p-3 border rounded-lg transition-all ${
                        format === fmt 
                          ? 'bg-primary-50 border-primary-500 text-primary-700 ring-1 ring-primary-500' 
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      <FileType size={20} className="mb-1" />
                      <span className="text-xs font-bold">{fmt}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex justify-end gap-3">
              <button 
                onClick={() => setSelectedReport(null)}
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
                    <Loader2 size={18} className="animate-spin" /> Gerando...
                  </>
                ) : (
                  <>
                    <Download size={18} /> Baixar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;