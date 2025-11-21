import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Users, 
  CreditCard, 
  Calendar, 
  Activity, 
  AlertTriangle, 
  TrendingDown, 
  Wrench, 
  Settings,
  ArrowRight
} from 'lucide-react';
import { KPI } from '../types';

const dataFrequency = [
  { name: 'Jan', value: 400 },
  { name: 'Fev', value: 300 },
  { name: 'Mar', value: 550 },
  { name: 'Abr', value: 480 },
  { name: 'Mai', value: 600 },
  { name: 'Jun', value: 750 },
];

const dataOccupation = [
  { name: 'Natação Adulto', value: 85 },
  { name: 'Hidroginástica', value: 65 },
  { name: 'Infantil', value: 92 },
  { name: 'Competição', value: 40 },
];

const dataStatus = [
  { name: 'Ativos', value: 420 },
  { name: 'Pendentes', value: 45 },
  { name: 'Inativos', value: 15 },
];

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444'];

const KpiCard: React.FC<{ kpi: KPI }> = ({ kpi }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between transition-all hover:shadow-md">
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{kpi.label}</p>
      <h3 className="text-2xl font-bold text-slate-800">{kpi.value}</h3>
      <div className={`flex items-center mt-2 text-xs font-semibold ${kpi.trend >= 0 ? 'text-teal-600' : 'text-red-500'}`}>
        {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
        <span className="text-slate-400 font-normal ml-1">vs. mês anterior</span>
      </div>
    </div>
    <div className={`p-3 rounded-lg bg-opacity-10 ${kpi.color.replace('text-', 'bg-')}`}>
      <kpi.icon className={kpi.color} size={24} />
    </div>
  </div>
);

const AlertItem: React.FC<{ type: 'financial' | 'frequency' | 'maintenance', title: string, subtitle: string }> = ({ type, title, subtitle }) => {
  const styles = {
    financial: { icon: AlertTriangle, bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' },
    frequency: { icon: TrendingDown, bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-100' },
    maintenance: { icon: Wrench, bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  };
  
  const Style = styles[type];
  const Icon = Style.icon;

  return (
    <div className={`flex items-center gap-4 p-3 rounded-lg border ${Style.bg} ${Style.border} mb-3 last:mb-0 cursor-pointer hover:opacity-80 transition-opacity`}>
      <div className={`p-2 rounded-full bg-white shadow-sm`}>
        <Icon size={16} className={Style.text} />
      </div>
      <div className="flex-1">
        <h4 className={`text-sm font-bold ${Style.text}`}>{title}</h4>
        <p className="text-xs text-slate-600">{subtitle}</p>
      </div>
      <ArrowRight size={14} className={Style.text} />
    </div>
  );
};

const Dashboard: React.FC = () => {
  const kpis: KPI[] = [
    { label: 'Total Alunos Ativos', value: 480, trend: 12, icon: Users, color: 'text-blue-600' },
    { label: 'Ocupação Média', value: '78%', trend: 5.2, icon: Activity, color: 'text-teal-600' },
    { label: 'Receita Mensal', value: 'R$ 42.5k', trend: 8.5, icon: CreditCard, color: 'text-green-600' },
    { label: 'Aulas Hoje', value: 14, trend: 0, icon: Calendar, color: 'text-purple-600' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Customization */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Visão Geral</h2>
          <p className="text-slate-500 text-sm">Acompanhe os indicadores principais da academia.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
          <Settings size={16} />
          Personalizar Indicadores
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, idx) => (
          <KpiCard key={idx} kpi={kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart - Frequency */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Frequência de Alunos</h3>
              <p className="text-sm text-slate-500">Evolução de presenças nos últimos 6 meses</p>
            </div>
            <select className="text-sm border border-slate-200 rounded-md px-2 py-1 text-slate-600 bg-slate-50 outline-none">
              <option>Últimos 6 meses</option>
              <option>Este ano</option>
            </select>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataFrequency}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  cursor={{ stroke: '#94a3b8', strokeWidth: 1 }}
                />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts Panel */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800">Atenção Necessária</h3>
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">5 Novos</span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2">
            <div className="mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Financeiro</div>
            <AlertItem type="financial" title="3 Mensalidades Vencidas" subtitle="Total: R$ 450,00 (Venc. ontem)" />
            <AlertItem type="financial" title="Erro no Processamento" subtitle="Cartão de crédito - Ana Silva" />

            <div className="mt-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Acadêmico</div>
            <AlertItem type="frequency" title="Baixa Frequência" subtitle="5 alunos com < 50% de presença" />

            <div className="mt-4 mb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Operacional</div>
            <AlertItem type="maintenance" title="Manutenção Preventiva" subtitle="Bomba Piscina 2 - Vence em 3 dias" />
          </div>
          
          <button className="w-full mt-4 py-2 text-sm text-primary-600 font-medium border border-primary-100 rounded-lg hover:bg-primary-50 transition-colors">
            Ver Central de Notificações
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Occupation Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-1">Ocupação das Turmas</h3>
          <p className="text-sm text-slate-500 mb-6">Distribuição percentual por modalidade</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataOccupation} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={110} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#475569', fontWeight: 500 }} />
                <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]} barSize={28}>
                   {dataOccupation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.value > 90 ? '#ef4444' : '#0d9488'} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Overview (formerly Pie, now more integrated) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-1">Status da Base</h3>
          <p className="text-sm text-slate-500 mb-6">Visão geral da carteira de alunos</p>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="h-52 w-52 flex-shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {dataStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-3xl font-bold text-slate-800">480</span>
                 <span className="text-xs text-slate-400 uppercase font-semibold">Total</span>
              </div>
            </div>
            
            <div className="flex-1 w-full space-y-4">
              {dataStatus.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                    <span className="font-medium text-slate-700">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{item.value}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-slate-100">
                <button className="text-sm text-primary-600 font-medium hover:underline flex items-center gap-1">
                   Ver relatório de retenção <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;