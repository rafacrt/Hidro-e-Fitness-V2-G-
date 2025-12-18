import React, { useEffect, useState } from 'react';
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
import { fetchDashboardKPIs, fetchDashboardCharts, fetchStudents } from '../services/api';

const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'];

const iconMap: any = {
  Users,
  CreditCard,
  Calendar,
  Activity
};

const KpiCard: React.FC<{ kpi: KPI }> = ({ kpi }) => {
  const IconComponent = typeof kpi.icon === 'string' ? iconMap[kpi.icon] || Activity : kpi.icon;

  return (
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
        <IconComponent className={kpi.color} size={24} />
      </div>
    </div>
  );
};

const Dashboard: React.FC = () => {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [chartsData, setChartsData] = useState<any>({ frequency: [], occupation: [], status: [] });
  const [birthdays, setBirthdays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [kpisData, charts, studentsData] = await Promise.all([
          fetchDashboardKPIs(),
          fetchDashboardCharts(),
          fetchStudents()
        ]);
        setKpis(kpisData);
        setChartsData(charts);

        // Process Birthdays
        const currentMonth = new Date().getMonth(); // 0-indexed
        const birthdayList = studentsData
          .filter(s => {
            if (!s.birthDate) return false;
            // Handle ISO (YYYY-MM-DD) or PT-BR (DD/MM/YYYY)
            let month;
            if (s.birthDate.includes('/')) {
              month = parseInt(s.birthDate.split('/')[1]) - 1;
            } else {
              month = new Date(s.birthDate).getMonth();
            }
            return month === currentMonth;
          })
          .map(s => {
            let day, birthYear;
            if (s.birthDate.includes('/')) {
              const parts = s.birthDate.split('/');
              day = parts[0];
              birthYear = parseInt(parts[2]);
            } else {
              const date = new Date(s.birthDate);
              day = date.getDate().toString().padStart(2, '0'); // Corrected so it's not off by one due to TZ if possible, but simplest is string split
              if (s.birthDate.includes('T')) day = s.birthDate.split('T')[0].split('-')[2]; // Robust ISO split
              else day = s.birthDate.split('-')[2];

              birthYear = new Date(s.birthDate).getFullYear();
            }

            const age = new Date().getFullYear() - birthYear;
            return {
              id: s.id,
              name: s.name,
              day,
              age
            };
          })
          .sort((a, b) => parseInt(a.day) - parseInt(b.day));

        setBirthdays(birthdayList);

      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Carregando indicadores...</div>;
  }

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
              <LineChart data={chartsData.frequency}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
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
            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">0 Novos</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            <p className="text-sm text-slate-400 italic text-center mt-10">Nenhum alerta pendente.</p>
          </div>

          <button className="w-full mt-4 py-2 text-sm text-primary-600 font-medium border border-primary-100 rounded-lg hover:bg-primary-50 transition-colors">
            Ver Central de Notificações
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upcoming Birthdays (Aniversariantes do Mês) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Aniversariantes do Mês</h3>
              <p className="text-sm text-slate-500">Alunos celebrando vida em {new Date().toLocaleDateString('pt-BR', { month: 'long' })}</p>
            </div>
            <div className="p-2 bg-pink-50 rounded-lg text-pink-500">
              <Calendar size={20} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 max-h-64 pr-2">
            {birthdays.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">Nenhum aniversariante encontrado neste mês.</div>
            ) : (
              birthdays.map((birthday, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-pink-50/50 border border-pink-100 hover:bg-pink-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-pink-200 text-pink-700 flex items-center justify-center text-xs font-bold">
                      {birthday.day}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-700 text-sm">{birthday.name}</h4>
                      <p className="text-xs text-slate-500">{birthday.age ? `${birthday.age} anos` : 'Parabéns!'}</p>
                    </div>
                  </div>
                  <button className="text-xs font-medium text-pink-600 hover:text-pink-700 px-2 py-1 rounded bg-white border border-pink-200 shadow-sm">
                    Parabenizar
                  </button>
                </div>
              ))
            )}
          </div>
          <button className="w-full mt-4 py-2 text-sm text-pink-600 font-medium border border-pink-200 rounded-lg hover:bg-pink-50 transition-colors flex items-center justify-center gap-2">
            Ver lista completa <ArrowRight size={14} />
          </button>
        </div>

        {/* Status Overview */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-1">Status da Base</h3>
          <p className="text-sm text-slate-500 mb-6">Visão geral da carteira de alunos</p>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="h-52 w-52 flex-shrink-0 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartsData.status}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartsData.status.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-slate-800">
                  {chartsData.status.reduce((acc: number, curr: any) => acc + curr.value, 0)}
                </span>
                <span className="text-xs text-slate-400 uppercase font-semibold">Total</span>
              </div>
            </div>

            <div className="flex-1 w-full space-y-4">
              {chartsData.status.map((item: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
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