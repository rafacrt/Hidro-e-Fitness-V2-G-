import React, { useState, useRef } from 'react';
import { 
  Plus, Search, FileText, MoreVertical, Loader2, MapPin, 
  Upload, Download, User, Shield, Activity, Trash2, File, 
  MessageCircle, Phone, Mail, AlertTriangle, Calendar, X, Edit
} from 'lucide-react';
import { mockStudents, fetchAddressByCep } from '../services/mockData';
import { Student, StudentDocument } from '../types';

type TabType = 'registration' | 'enrollment' | 'documents';

const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>(mockStudents as any);
  
  // Modals State
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState<Student | null>(null);
  
  // Actions Menu State
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  
  // Editing State
  const [isEditing, setIsEditing] = useState(false);

  const [loadingCep, setLoadingCep] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('registration');
  
  // Form State
  const [formData, setFormData] = useState<Partial<Student>>({
    name: '', email: '', cpf: '', birthDate: '', phone: '', isWhatsapp: false,
    plan: 'Hidro 2x', modality: 'Hidroginástica', status: 'Ativo',
    address: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '', complement: '' },
    guardian: { name: '', cpf: '', phone: '', relationship: '' },
    medicalNotes: '', documents: []
  });

  // --- Helpers ---

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const isMinor = React.useMemo(() => {
    if (!formData.birthDate) return false;
    return calculateAge(formData.birthDate) < 18;
  }, [formData.birthDate]);

  // --- Handlers ---

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address!, [field]: value }
    }));
  };

  const handleGuardianChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      guardian: { ...prev.guardian!, [field]: value }
    }));
  };

  const handleCepBlur = async () => {
    if (formData.address?.cep && formData.address.cep.replace(/\D/g, '').length === 8) {
      setLoadingCep(true);
      try {
        const address = await fetchAddressByCep(formData.address.cep);
        setFormData(prev => ({
          ...prev,
          address: {
            ...prev.address!,
            street: address.logradouro || '',
            neighborhood: address.bairro || '',
            city: address.localidade || '',
            state: address.uf || ''
          }
        }));
      } catch (error) {
        // Silent fail
      } finally {
        setLoadingCep(false);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newDoc: StudentDocument = {
        id: Math.random().toString(),
        name: file.name,
        type: file.name.endsWith('pdf') ? 'PDF' : 'IMAGE',
        uploadDate: new Date().toLocaleDateString()
      };
      setFormData(prev => ({
        ...prev,
        documents: [...(prev.documents || []), newDoc]
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && formData.id) {
      // Update existing
      setStudents(prev => prev.map(s => s.id === formData.id ? { ...formData } as Student : s));
      alert('Aluno atualizado com sucesso!');
    } else {
      // Create new
      const newStudent = { 
        ...formData, 
        id: Math.random(), 
        enrollmentDate: new Date().toISOString() 
      } as Student;
      setStudents(prev => [...prev, newStudent]);
      alert('Aluno cadastrado com sucesso!');
    }
    setShowFormModal(false);
  };

  // --- Action Handlers ---

  const handleOpenNew = () => {
    setIsEditing(false);
    setFormData({
      name: '', email: '', cpf: '', birthDate: '', phone: '', isWhatsapp: false,
      plan: 'Hidro 2x', modality: 'Hidroginástica', status: 'Ativo',
      address: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '', complement: '' },
      guardian: { name: '', cpf: '', phone: '', relationship: '' },
      medicalNotes: '', documents: []
    });
    setShowFormModal(true);
  };

  const handleOpenEdit = (student: Student) => {
    setIsEditing(true);
    setFormData({ ...student });
    setOpenMenuId(null);
    setShowDetailsModal(null); // Close details if open
    setShowFormModal(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este aluno? Esta ação é irreversível.')) {
      setStudents(prev => prev.filter(s => s.id !== id));
      setOpenMenuId(null);
      setShowDetailsModal(null);
    }
  };

  const handleRowClick = (student: Student) => {
    setShowDetailsModal(student);
  };

  // --- Render Components ---
  
  const renderTabNavigation = () => (
    <div className="flex border-b border-slate-200 mb-6">
      {[
        { id: 'registration', label: 'Dados Cadastrais', icon: User },
        { id: 'enrollment', label: 'Matrícula', icon: FileText },
        { id: 'documents', label: 'Arquivos', icon: Upload },
      ].map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setActiveTab(tab.id as TabType)}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === tab.id 
              ? 'border-primary-600 text-primary-700' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          <tab.icon size={16} />
          <span className="hidden sm:inline">{tab.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-6" onClick={() => setOpenMenuId(null)}>
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome, CPF ou matrícula..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <button className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 flex items-center gap-2 bg-white">
            <Upload size={18} />
            Importar CSV
          </button>
          <button className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 flex items-center gap-2 bg-white">
            <Download size={18} />
            Exportar
          </button>
          <button 
            onClick={handleOpenNew}
            className="px-4 py-2.5 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 flex items-center gap-2 shadow-lg shadow-primary-200"
          >
            <Plus size={18} />
            Novo Aluno
          </button>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase w-[30%]">Aluno</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase w-[20%]">Plano/Turma</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase w-[15%]">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase w-[20%]">Financeiro</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right w-[15%]">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student) => (
                <tr 
                  key={student.id} 
                  onClick={() => handleRowClick(student)}
                  className="hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 group-hover:text-primary-600 transition-colors">{student.name}</div>
                        <div className="text-xs text-slate-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900">{student.plan}</div>
                    <div className="text-xs text-slate-500">{student.modality || 'Natação'}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${student.status === 'Ativo' ? 'bg-green-100 text-green-800' : 
                        student.status === 'Inativo' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                      {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm">
                      <div className={`w-2 h-2 rounded-full ${
                        student.paymentStatus === 'Pago' ? 'bg-teal-500' : 
                        student.paymentStatus === 'Pendente' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      {student.paymentStatus}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right relative" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === student.id ? null : student.id); }}
                      className="p-2 text-slate-400 hover:text-primary-600 rounded-full hover:bg-slate-100 transition-colors"
                    >
                      <MoreVertical size={18} />
                    </button>

                    {/* Action Menu Dropdown */}
                    {openMenuId === student.id && (
                      <div className="absolute right-8 top-8 w-40 bg-white rounded-lg shadow-lg border border-slate-100 z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <button 
                          onClick={() => handleOpenEdit(student)}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary-600 flex items-center gap-2"
                        >
                          <Edit size={16} /> Editar
                        </button>
                        <button 
                          onClick={() => handleDelete(student.id)}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-50"
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

      {/* --- MODAL: FICHA DO ALUNO (LEITURA) --- */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-start">
                 <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-primary-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-primary-200">
                       {showDetailsModal.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                       <h2 className="text-2xl font-bold text-slate-800">{showDetailsModal.name}</h2>
                       <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-slate-500">Matrícula: #{showDetailsModal.id.toString().padStart(6, '0')}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${showDetailsModal.status === 'Ativo' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}`}>
                             {showDetailsModal.status}
                          </span>
                       </div>
                    </div>
                 </div>
                 <div className="flex items-center gap-2">
                    <button 
                       onClick={() => handleOpenEdit(showDetailsModal)}
                       className="p-2 text-slate-500 hover:text-primary-600 hover:bg-white rounded-lg transition-colors" 
                       title="Editar"
                    >
                       <Edit size={20} />
                    </button>
                    <button 
                       onClick={() => setShowDetailsModal(null)}
                       className="p-2 text-slate-500 hover:text-red-500 hover:bg-white rounded-lg transition-colors"
                    >
                       <X size={24} />
                    </button>
                 </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-8 bg-white">
                 <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Main Info */}
                    <div className="lg:col-span-2 space-y-8">
                       {/* Personal Info */}
                       <section>
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                             <User size={16} /> Dados Pessoais
                          </h3>
                          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 grid grid-cols-2 gap-6">
                             <div>
                                <label className="text-xs text-slate-500 font-medium">CPF</label>
                                <p className="text-slate-800 font-medium">{showDetailsModal.cpf}</p>
                             </div>
                             <div>
                                <label className="text-xs text-slate-500 font-medium">Data de Nascimento</label>
                                <p className="text-slate-800 font-medium">
                                   {new Date(showDetailsModal.birthDate).toLocaleDateString('pt-BR')} 
                                   <span className="text-slate-400 text-xs ml-1">({calculateAge(showDetailsModal.birthDate)} anos)</span>
                                </p>
                             </div>
                             <div>
                                <label className="text-xs text-slate-500 font-medium">Email</label>
                                <p className="text-slate-800 font-medium flex items-center gap-2">
                                   <Mail size={14} className="text-slate-400"/> {showDetailsModal.email}
                                </p>
                             </div>
                             <div>
                                <label className="text-xs text-slate-500 font-medium">Telefone</label>
                                <p className="text-slate-800 font-medium flex items-center gap-2">
                                   <Phone size={14} className="text-slate-400"/> {showDetailsModal.phone}
                                   {showDetailsModal.isWhatsapp && <MessageCircle size={14} className="text-green-500" />}
                                </p>
                             </div>
                          </div>
                       </section>

                       {/* Address */}
                       <section>
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                             <MapPin size={16} /> Endereço
                          </h3>
                          <div className="bg-slate-50 rounded-xl p-5 border border-slate-100">
                             <p className="text-slate-800 font-medium">
                                {showDetailsModal.address.street}, {showDetailsModal.address.number}
                             </p>
                             <p className="text-slate-600 text-sm">
                                {showDetailsModal.address.neighborhood} - {showDetailsModal.address.city}/{showDetailsModal.address.state}
                             </p>
                             <p className="text-slate-500 text-xs mt-1">CEP: {showDetailsModal.address.cep}</p>
                          </div>
                       </section>

                       {/* Medical Notes */}
                       {showDetailsModal.medicalNotes && (
                          <section>
                             <h3 className="text-sm font-bold text-orange-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Activity size={16} /> Observações Médicas
                             </h3>
                             <div className="bg-orange-50 rounded-xl p-5 border border-orange-100 text-orange-900">
                                {showDetailsModal.medicalNotes}
                             </div>
                          </section>
                       )}
                    </div>

                    {/* Right Column: Contract & Guardian */}
                    <div className="space-y-8">
                       {/* Plan Info */}
                       <section>
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                             <FileText size={16} /> Plano Atual
                          </h3>
                          <div className="bg-primary-50 rounded-xl p-5 border border-primary-100 relative overflow-hidden">
                             <div className="relative z-10">
                                <p className="text-xs text-primary-600 font-bold uppercase mb-1">{showDetailsModal.modality}</p>
                                <h4 className="text-xl font-bold text-primary-900 mb-2">{showDetailsModal.plan}</h4>
                                <div className="flex items-center gap-2 text-primary-700 text-sm">
                                   <Calendar size={14} /> 
                                   Desde: {new Date(showDetailsModal.enrollmentDate).toLocaleDateString('pt-BR')}
                                </div>
                             </div>
                             <div className="absolute right-0 top-0 w-24 h-24 bg-primary-100 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                          </div>
                       </section>

                       {/* Guardian (If Minor) */}
                       {calculateAge(showDetailsModal.birthDate) < 18 && showDetailsModal.guardian && (
                          <section>
                             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                <Shield size={16} /> Responsável
                             </h3>
                             <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                                <p className="font-bold text-slate-800">{showDetailsModal.guardian.name}</p>
                                <p className="text-sm text-slate-500 mb-2">CPF: {showDetailsModal.guardian.cpf}</p>
                                <a href={`tel:${showDetailsModal.guardian.phone}`} className="flex items-center gap-2 text-sm text-primary-600 font-medium hover:underline">
                                   <Phone size={14} /> {showDetailsModal.guardian.phone}
                                </a>
                             </div>
                          </section>
                       )}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- MODAL: FORMULÁRIO (NOVO / EDITAR) --- */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-xl">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {isEditing ? 'Editar Aluno' : 'Cadastrar Novo Aluno'}
                </h2>
                <p className="text-sm text-slate-500">
                  {isEditing ? 'Atualize os dados abaixo.' : 'Preencha a ficha cadastral do aluno.'}
                </p>
              </div>
              <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <Plus size={28} className="rotate-45" />
              </button>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
                {renderTabNavigation()}

                <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                  
                  {/* TAB 1: REGISTRATION (Unified) */}
                  {activeTab === 'registration' && (
                    <div className="space-y-8">
                      
                      {/* SECTION: PERSONAL */}
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2 border-b pb-2">
                           <User size={16} className="text-primary-600"/> Dados Pessoais
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo <span className="text-red-500">*</span></label>
                            <input 
                              required
                              value={formData.name}
                              onChange={e => setFormData({...formData, name: e.target.value})}
                              placeholder="Ex: João da Silva"
                              className="w-full px-4 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Data de Nascimento</label>
                            <input 
                              type="date"
                              value={formData.birthDate}
                              onChange={e => setFormData({...formData, birthDate: e.target.value})}
                              className="w-full px-4 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                            <input 
                              placeholder="000.000.000-00"
                              value={formData.cpf}
                              onChange={e => setFormData({...formData, cpf: e.target.value})}
                              className="w-full px-4 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Celular</label>
                            <input 
                              placeholder="(00) 00000-0000"
                              value={formData.phone}
                              onChange={e => setFormData({...formData, phone: e.target.value})}
                              className="w-full px-4 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500"
                            />
                            <div className="flex items-center mt-2">
                              <input 
                                type="checkbox" 
                                id="whatsapp"
                                checked={formData.isWhatsapp}
                                onChange={e => setFormData({...formData, isWhatsapp: e.target.checked})}
                                className="w-4 h-4 text-green-600 rounded border-slate-300 focus:ring-green-500" 
                              />
                              <label htmlFor="whatsapp" className="ml-2 text-sm text-slate-600 cursor-pointer select-none">
                                Este número é WhatsApp
                              </label>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                            <input 
                              type="email"
                              value={formData.email}
                              onChange={e => setFormData({...formData, email: e.target.value})}
                              placeholder="email@exemplo.com"
                              className="w-full px-4 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* SECTION: GUARDIAN (Conditional) */}
                      {isMinor && (
                        <div className="bg-orange-50 p-5 rounded-lg border border-orange-100 animate-in fade-in slide-in-from-top-4">
                          <h4 className="text-sm font-bold text-orange-800 uppercase tracking-wider mb-4 flex items-center gap-2 pb-2 border-b border-orange-200">
                             <Shield size={16}/> Responsável (Aluno Menor)
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="md:col-span-2">
                              <label className="block text-sm font-medium text-orange-900 mb-1">Nome do Responsável</label>
                              <input 
                                value={formData.guardian?.name}
                                onChange={e => handleGuardianChange('name', e.target.value)}
                                className="w-full px-4 py-2 bg-white rounded-lg border border-orange-200 focus:ring-2 focus:ring-orange-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-orange-900 mb-1">CPF</label>
                              <input 
                                value={formData.guardian?.cpf}
                                onChange={e => handleGuardianChange('cpf', e.target.value)}
                                className="w-full px-4 py-2 bg-white rounded-lg border border-orange-200 focus:ring-2 focus:ring-orange-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-orange-900 mb-1">Telefone</label>
                              <input 
                                value={formData.guardian?.phone}
                                onChange={e => handleGuardianChange('phone', e.target.value)}
                                className="w-full px-4 py-2 bg-white rounded-lg border border-orange-200 focus:ring-2 focus:ring-orange-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SECTION: ADDRESS */}
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2 border-b pb-2">
                           <MapPin size={16} className="text-primary-600"/> Endereço
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-5">
                          <div className="md:col-span-2 relative">
                            <label className="block text-sm font-medium text-slate-700 mb-1">CEP</label>
                            <div className="relative">
                              <input 
                                value={formData.address?.cep}
                                onChange={e => handleAddressChange('cep', e.target.value)}
                                onBlur={handleCepBlur}
                                placeholder="00000-000"
                                className="w-full px-4 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500 pr-10"
                              />
                              {loadingCep ? (
                                <Loader2 className="absolute right-3 top-2.5 animate-spin text-primary-500" size={18} />
                              ) : (
                                <Search className="absolute right-3 top-2.5 text-slate-400" size={18} />
                              )}
                            </div>
                          </div>
                          <div className="md:col-span-4">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Rua / Logradouro</label>
                            <input 
                              value={formData.address?.street}
                              onChange={e => handleAddressChange('street', e.target.value)}
                              className="w-full px-4 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <div className="md:col-span-1">
                             <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
                             <input 
                                value={formData.address?.number}
                                onChange={e => handleAddressChange('number', e.target.value)}
                                className="w-full px-4 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500"
                             />
                          </div>
                          <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                             <input 
                                value={formData.address?.neighborhood}
                                onChange={e => handleAddressChange('neighborhood', e.target.value)}
                                className="w-full px-4 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500"
                             />
                          </div>
                          <div className="md:col-span-2">
                             <label className="block text-sm font-medium text-slate-700 mb-1">Cidade</label>
                             <input 
                                value={formData.address?.city}
                                onChange={e => handleAddressChange('city', e.target.value)}
                                className="w-full px-4 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500"
                             />
                          </div>
                          <div className="md:col-span-1">
                             <label className="block text-sm font-medium text-slate-700 mb-1">UF</label>
                             <input 
                                value={formData.address?.state}
                                onChange={e => handleAddressChange('state', e.target.value)}
                                className="w-full px-4 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500"
                             />
                          </div>
                        </div>
                      </div>

                      {/* SECTION: MEDICAL */}
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2 border-b pb-2">
                           <Activity size={16} className="text-primary-600"/> Informações Médicas
                        </h3>
                        <div className="space-y-4">
                           <div className="bg-blue-50 p-3 rounded-lg text-blue-800 text-xs">
                              Utilize este campo para alergias, condições crônicas ou observações físicas importantes.
                           </div>
                           <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Observações</label>
                            <textarea 
                              rows={4}
                              placeholder="Ex: Alérgico a cloro (nível leve), histórico de asma..."
                              value={formData.medicalNotes}
                              onChange={e => setFormData({...formData, medicalNotes: e.target.value})}
                              className="w-full px-4 py-3 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500"
                            />
                           </div>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* TAB 2: ENROLLMENT */}
                  {activeTab === 'enrollment' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Modalidade</label>
                          <select 
                            className="w-full px-4 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500"
                            value={formData.modality}
                            onChange={e => setFormData({...formData, modality: e.target.value})}
                          >
                             <option>Hidroginástica</option>
                             <option>Natação Adulto</option>
                             <option>Natação Infantil</option>
                             <option>Natação Bebê</option>
                          </select>
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Plano de Pagamento</label>
                          <select 
                             className="w-full px-4 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500"
                             value={formData.plan}
                             onChange={e => setFormData({...formData, plan: e.target.value})}
                          >
                             <option>Mensal (2x semana)</option>
                             <option>Mensal (3x semana)</option>
                             <option>Trimestral</option>
                             <option>Semestral</option>
                             <option>Anual</option>
                          </select>
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Turma Preferencial</label>
                          <select className="w-full px-4 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500">
                             <option value="">Selecionar Turma...</option>
                             <option>07:00 - Hidro (Prof. Lucas)</option>
                             <option>08:00 - Natação (Prof. Marina)</option>
                             <option>18:00 - Hidro (Prof. Roberto)</option>
                          </select>
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Status da Matrícula</label>
                          <select 
                            className="w-full px-4 py-2 bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-primary-500"
                            value={formData.status}
                            onChange={e => setFormData({...formData, status: e.target.value as any})}
                          >
                             <option value="Ativo">Ativo</option>
                             <option value="Inativo">Inativo</option>
                             <option value="Trancado">Trancado</option>
                          </select>
                       </div>
                    </div>
                  )}

                  {/* TAB 3: DOCUMENTS */}
                  {activeTab === 'documents' && (
                    <div className="space-y-6">
                      <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors relative">
                        <input 
                          type="file" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={handleFileUpload}
                        />
                        <div className="flex flex-col items-center gap-2 text-slate-500">
                           <div className="p-3 bg-slate-100 rounded-full">
                              <Upload size={24} />
                           </div>
                           <p className="font-medium text-slate-700">Clique ou arraste arquivos aqui</p>
                           <p className="text-xs">PDF, Imagens ou DOC (Atestados, Documentos, Fichas)</p>
                        </div>
                      </div>

                      {/* File List */}
                      <div className="space-y-2">
                         <h4 className="text-sm font-bold text-slate-800 mb-2">Arquivos Anexados</h4>
                         {formData.documents?.length === 0 && (
                           <p className="text-sm text-slate-400 italic">Nenhum documento anexado.</p>
                         )}
                         {formData.documents?.map((doc) => (
                           <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                              <div className="flex items-center gap-3">
                                 <File size={18} className="text-primary-500" />
                                 <div>
                                    <p className="text-sm font-medium text-slate-700">{doc.name}</p>
                                    <p className="text-xs text-slate-400">{doc.uploadDate}</p>
                                 </div>
                              </div>
                              <button className="text-slate-400 hover:text-red-500">
                                 <Trash2 size={16} />
                              </button>
                           </div>
                         ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-6 border-t border-slate-200 bg-white flex justify-end gap-3 rounded-b-xl">
                <button 
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-6 py-2.5 rounded-lg text-slate-600 font-medium hover:bg-slate-50 border border-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-8 py-2.5 rounded-lg bg-primary-600 text-white font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 transition-colors"
                >
                  {isEditing ? 'Atualizar Aluno' : 'Salvar Aluno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;