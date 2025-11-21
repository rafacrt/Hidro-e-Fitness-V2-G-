import React, { useState } from 'react';
import { mockClasses, mockModalities, mockPlans, mockStudents } from '../services/mockData';
import { 
  Clock, Users, Calendar, CheckCircle, XCircle, Plus, 
  Settings, DollarSign, Award, MoreVertical, Search, X, Save
} from 'lucide-react';
import { ClassSession, Plan } from '../types';

type TabType = 'schedule' | 'modalities' | 'plans';

const Classes: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('schedule');
  
  // Modal States
  const [showAttendance, setShowAttendance] = useState<number | null>(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showModalityModal, setShowModalityModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  
  // --- Helpers ---
  const getModalityName = (id: string) => mockModalities.find(m => m.id === id)?.name || 'Geral';
  const getModalityColor = (id: string) => mockModalities.find(m => m.id === id)?.color || 'bg-slate-500';

  const handleSave = (type: string) => {
    alert(`${type} salvo com sucesso!`);
    setShowClassModal(false);
    setShowModalityModal(false);
    setShowPlanModal(false);
  };

  // --- Render: Schedule Tab ---
  const renderSchedule = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Calendar className="text-primary-600" size={20} />
          Turmas e Horários
        </h3>
        <button 
          onClick={() => setShowClassModal(true)}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-lg shadow-primary-200 flex items-center gap-2 text-sm font-medium"
        >
          <Plus size={16} /> Nova Turma
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {mockClasses.map((cls) => {
          const percentage = Math.round((cls.enrolled / cls.capacity) * 100);
          const isFull = percentage >= 100;
          const modColor = getModalityColor(cls.modalityId);

          return (
            <div key={cls.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-primary-300 transition-all flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
              {/* Color Bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${modColor.replace('bg-', 'bg-')}`}></div>

              {/* Time Info */}
              <div className="flex-shrink-0 w-full md:w-32 text-center md:text-left pl-2">
                <div className="flex items-center justify-center md:justify-start gap-2 text-slate-800 font-bold text-lg">
                  {cls.time}
                </div>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">
                  {cls.days.join(' · ')}
                </div>
              </div>

              {/* Class Info */}
              <div className="flex-1 min-w-0 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                   <span className={`w-2 h-2 rounded-full ${modColor}`}></span>
                   <h3 className="font-bold text-slate-800 truncate">{cls.name}</h3>
                </div>
                <p className="text-sm text-slate-500 flex items-center justify-center md:justify-start gap-2">
                   <Users size={14} /> {cls.instructor} 
                   <span className="text-slate-300">|</span>
                   {getModalityName(cls.modalityId)}
                </p>
              </div>

              {/* Capacity & Status */}
              <div className="w-full md:w-48">
                <div className="flex justify-between text-xs mb-1 font-medium">
                  <span className="text-slate-500">Ocupação</span>
                  <span className={isFull ? 'text-red-600 font-bold' : 'text-teal-600'}>
                    {cls.enrolled}/{cls.capacity} ({percentage}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-teal-500'}`} 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                {isFull && (
                   <p className="text-[10px] text-red-500 font-semibold mt-1 text-right">Lista de Espera: 2</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4 w-full md:w-auto justify-center">
                <button 
                  onClick={() => setShowAttendance(cls.id)}
                  className="px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  Chamada
                </button>
                <button className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-50 rounded-lg transition-colors">
                  <Settings size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // --- Render: Modalities Tab ---
  const renderModalities = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Award className="text-purple-600" size={20} />
          Modalidades Esportivas
        </h3>
        <button 
          onClick={() => setShowModalityModal(true)}
          className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium flex items-center gap-2"
        >
          <Plus size={16} /> Nova Modalidade
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockModalities.map((mod) => (
          <div key={mod.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 relative group hover:shadow-md transition-all">
            <div className={`absolute top-0 left-0 w-full h-1.5 rounded-t-xl ${mod.color}`} />
            <div className="flex justify-between items-start mb-3">
              <h4 className="font-bold text-slate-800 text-lg">{mod.name}</h4>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs font-bold rounded uppercase">
                {mod.targetAudience}
              </span>
            </div>
            <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">
              {mod.description}
            </p>
            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
               <span className="text-xs text-slate-400 font-medium">ID: {mod.id}</span>
               <button className="text-primary-600 text-sm font-medium hover:underline">Editar Regras</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // --- Render: Plans Tab ---
  const renderPlans = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <DollarSign className="text-green-600" size={20} />
          Planos e Preços
        </h3>
        <button 
          onClick={() => setShowPlanModal(true)}
          className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-lg flex items-center gap-2 text-sm font-medium"
        >
          <Plus size={16} /> Novo Plano
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Nome do Plano</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Modalidade</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Frequência</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Valor</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockPlans.map((plan) => (
              <tr key={plan.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-900">{plan.name}</td>
                <td className="px-6 py-4 text-slate-600 text-sm">{getModalityName(plan.modalityId)}</td>
                <td className="px-6 py-4 text-slate-600 text-sm">
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold uppercase text-slate-600">
                    {plan.frequency}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-green-700">
                  R$ {plan.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-slate-400 hover:text-primary-600 p-1">
                    <Settings size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Top Navigation Tabs */}
      <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex mb-2">
        <button 
          onClick={() => setActiveTab('schedule')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === 'schedule' ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calendar size={16} /> Grade & Turmas
        </button>
        <button 
          onClick={() => setActiveTab('modalities')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === 'modalities' ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Award size={16} /> Modalidades
        </button>
        <button 
          onClick={() => setActiveTab('plans')}
          className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
            activeTab === 'plans' ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <DollarSign size={16} /> Planos & Preços
        </button>
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in duration-500 slide-in-from-bottom-2">
        {activeTab === 'schedule' && renderSchedule()}
        {activeTab === 'modalities' && renderModalities()}
        {activeTab === 'plans' && renderPlans()}
      </div>

      {/* --- MODALS --- */}

      {/* Attendance Modal */}
      {showAttendance && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Registro de Chamada</h3>
                <p className="text-sm text-slate-500">
                   {mockClasses.find(c => c.id === showAttendance)?.name} • {new Date().toLocaleDateString()}
                </p>
              </div>
              <button onClick={() => setShowAttendance(null)} className="text-slate-400 hover:text-red-500"><Plus size={24} className="rotate-45" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {/* Search within attendance */}
              <div className="relative mb-4">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input 
                   placeholder="Buscar aluno..." 
                   className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500" 
                 />
              </div>

              <div className="space-y-2">
                {mockStudents.slice(0, 8).map((student, idx) => (
                  <div key={student.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">
                           {student.name.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-700">{student.name}</span>
                     </div>
                     <div className="flex gap-2">
                        <button className="p-2 rounded bg-green-50 text-green-600 hover:bg-green-100 transition-colors" title="Presente">
                           <CheckCircle size={20} />
                        </button>
                        <button className="p-2 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors" title="Ausente">
                           <XCircle size={20} />
                        </button>
                     </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex justify-end gap-3">
               <button onClick={() => setShowAttendance(null)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded-lg transition-colors">Cancelar</button>
               <button onClick={() => { alert('Chamada salva!'); setShowAttendance(null); }} className="px-6 py-2 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 shadow-md">Finalizar Chamada</button>
            </div>
          </div>
        </div>
      )}

      {/* Create Class Modal */}
      {showClassModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="text-lg font-bold text-slate-800">Nova Turma</h3>
                 <button onClick={() => setShowClassModal(false)}><X className="text-slate-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Turma</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Ex: Hidro Matinal A" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Modalidade</label>
                       <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                          {mockModalities.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Professor</label>
                       <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Nome do instrutor" />
                    </div>
                 </div>
                 <div className="grid grid-cols-3 gap-4">
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Início</label>
                       <input type="time" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Fim</label>
                       <input type="time" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Vagas</label>
                       <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="20" />
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Dias da Semana</label>
                    <div className="flex gap-2">
                       {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                          <label key={day} className="flex-1 flex items-center justify-center py-2 border border-slate-200 rounded hover:bg-slate-50 cursor-pointer">
                             <input type="checkbox" className="hidden peer" />
                             <span className="text-xs font-bold text-slate-500 peer-checked:text-primary-600">{day}</span>
                          </label>
                       ))}
                    </div>
                 </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex justify-end gap-3">
                 <button onClick={() => setShowClassModal(false)} className="px-4 py-2 text-slate-600">Cancelar</button>
                 <button onClick={() => handleSave('Turma')} className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium">Salvar Turma</button>
              </div>
           </div>
        </div>
      )}

      {/* Create Modality Modal */}
      {showModalityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="text-lg font-bold text-slate-800">Nova Modalidade</h3>
                 <button onClick={() => setShowModalityModal(false)}><X className="text-slate-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Modalidade</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Ex: Cross Swim" />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Público Alvo</label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                       <option>Adulto</option>
                       <option>Infantil</option>
                       <option>Idoso</option>
                       <option>Todos</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cor de Identificação</label>
                    <div className="flex gap-2">
                       {['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500'].map(color => (
                          <button key={color} className={`w-8 h-8 rounded-full ${color} ring-2 ring-offset-2 ring-transparent hover:ring-slate-300`}></button>
                       ))}
                    </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                    <textarea className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" rows={3}></textarea>
                 </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex justify-end gap-3">
                 <button onClick={() => setShowModalityModal(false)} className="px-4 py-2 text-slate-600">Cancelar</button>
                 <button onClick={() => handleSave('Modalidade')} className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium">Salvar</button>
              </div>
           </div>
        </div>
      )}

      {/* Create Plan Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                 <h3 className="text-lg font-bold text-slate-800">Novo Plano de Preço</h3>
                 <button onClick={() => setShowPlanModal(false)}><X className="text-slate-400" /></button>
              </div>
              <div className="p-6 space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Plano</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="Ex: Semestral 2024" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Modalidade</label>
                       <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                          {mockModalities.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Frequência</label>
                       <select className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500">
                          <option>Mensal</option>
                          <option>Trimestral</option>
                          <option>Semestral</option>
                          <option>Anual</option>
                       </select>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Aulas por Semana</label>
                       <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="2" />
                    </div>
                    <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">Preço Total (R$)</label>
                       <input type="number" className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500" placeholder="0,00" />
                    </div>
                 </div>
              </div>
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex justify-end gap-3">
                 <button onClick={() => setShowPlanModal(false)} className="px-4 py-2 text-slate-600">Cancelar</button>
                 <button onClick={() => handleSave('Plano')} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium">Salvar Plano</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Classes;