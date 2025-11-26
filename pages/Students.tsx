import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Search, FileText, MoreVertical, Loader2, MapPin,
  Upload, Download, User, Shield, Activity, Trash2, File,
  MessageCircle, Phone, Mail, AlertTriangle, Calendar, X, Edit, Printer
} from 'lucide-react';
import {
  fetchStudents, createStudent, updateStudent, deleteStudent,
  fetchModalities, fetchPlans, fetchAddressByCep
} from '../services/api';
import { Student, StudentDocument, Modality, Plan } from '../types';
import { exportToCSV, parseCSV, downloadTemplate } from '../utils/csvHelper';

type TabType = 'registration' | 'enrollment' | 'documents';

const Students: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState<Student[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

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
    plan: '', modality: '', status: 'Ativo',
    address: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '', complement: '' },
    guardian: { name: '', cpf: '', phone: '', relationship: '' },
    medicalNotes: '', documents: []
  });

  // --- Initial Data Fetching ---
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsData, modalitiesData, plansData] = await Promise.all([
        fetchStudents(),
        fetchModalities(),
        fetchPlans()
      ]);
      setStudents(studentsData);
      setModalities(modalitiesData);
      setPlans(plansData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleExportCSV = () => {
    const headers = [
      'name', 'email', 'cpf', 'rg', 'birthDate', 'phone', 'isWhatsapp',
      'plan', 'modality', 'status',
      'cep', 'street', 'number', 'neighborhood', 'city', 'state', 'complement',
      'guardianName', 'guardianCpf', 'guardianPhone', 'guardianRelationship',
      'medicalNotes'
    ];

    const data = students.map(s => ({
      name: s.name,
      email: s.email,
      cpf: s.cpf,
      rg: s.rg,
      birthDate: s.birthDate,
      phone: s.phone,
      isWhatsapp: s.isWhatsapp ? 'Sim' : 'Não',
      plan: s.plan,
      modality: s.modality,
      status: s.status,
      cep: s.address?.cep,
      street: s.address?.street,
      number: s.address?.number,
      neighborhood: s.address?.neighborhood,
      city: s.address?.city,
      state: s.address?.state,
      complement: s.address?.complement,
      guardianName: s.guardian?.name,
      guardianCpf: s.guardian?.cpf,
      guardianPhone: s.guardian?.phone,
      guardianRelationship: s.guardian?.relationship,
      medicalNotes: s.medicalNotes
    }));

    exportToCSV(data, headers, 'alunos');
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const parsedData = await parseCSV(e.target.files[0]);

        for (const row of parsedData) {
          // Clean \N values
          Object.keys(row).forEach(key => {
            if (row[key] === '\\N') row[key] = null;
          });

          const newStudent: any = {
            name: row.name,
            email: row.email,
            cpf: row.cpf,
            rg: row.rg,
            birthDate: row.birthDate,
            phone: row.phone,
            isWhatsapp: row.isWhatsapp === 'Sim',
            plan: row.plan,
            modality: row.modality,
            status: row.status || 'Ativo',
            address: {
              cep: row.cep,
              street: row.street,
              number: row.number,
              neighborhood: row.neighborhood,
              city: row.city,
              state: row.state,
              complement: row.complement
            },
            guardian: {
              name: row.guardianName,
              cpf: row.guardianCpf,
              phone: row.guardianPhone,
              relationship: row.guardianRelationship
            },
            medicalNotes: row.medicalNotes
          };
          await createStudent(newStudent);
        }
        alert('Importação concluída com sucesso!');
        loadData();
      } catch (error) {
        console.error(error);
        alert('Erro ao importar CSV. Verifique o formato do arquivo.');
      }
    }
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'name', 'email', 'cpf', 'rg', 'birthDate', 'phone', 'isWhatsapp',
      'plan', 'modality', 'status',
      'cep', 'street', 'number', 'neighborhood', 'city', 'state', 'complement',
      'guardianName', 'guardianCpf', 'guardianPhone', 'guardianRelationship',
      'medicalNotes'
    ];
    downloadTemplate(headers, 'alunos');
  }

  const handleExportPDF = () => {
    window.print();
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && formData.id) {
        await updateStudent(formData.id, formData as Student);
        alert('Aluno atualizado com sucesso!');
      } else {
        await createStudent(formData as Omit<Student, 'id'>);
        alert('Aluno cadastrado com sucesso!');
      }
      setShowFormModal(false);
      loadData();
    } catch (error) {
      console.error('Erro ao salvar aluno:', error);
      alert('Erro ao salvar aluno. Verifique os dados.');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este aluno?')) {
      try {
        await deleteStudent(id);
        loadData();
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir aluno.');
      }
    }
  };

  // --- Action Handlers ---

  const handleOpenNew = () => {
    setIsEditing(false);
    setFormData({
      name: '', email: '', cpf: '', birthDate: '', phone: '', isWhatsapp: false,
      plan: plans.length > 0 ? plans[0].name : '',
      modality: modalities.length > 0 ? modalities[0].name : '',
      status: 'Ativo',
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
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
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

  if (loading) {
    return <div className="p-8 text-center text-slate-500 flex flex-col items-center gap-2">
      <Loader2 className="animate-spin text-primary-600" size={32} />
      <p>Carregando alunos...</p>
    </div>;
  }

  return (
    <div className="space-y-6" onClick={() => setOpenMenuId(null)}>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-only, .print-only * {
            visibility: visible;
          }
          .print-only {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between gap-4 no-print">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou matrícula..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-primary-500 focus:outline-none bg-white"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExportCSV} className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white" title="Exportar CSV">
            <FileText size={20} />
          </button>
          <button onClick={handleExportPDF} className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white" title="Imprimir / PDF">
            <Printer size={20} />
          </button>
          <label className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white cursor-pointer" title="Importar CSV">
            <Upload size={20} />
            <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} />
          </label>
          <button onClick={handleDownloadTemplate} className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 bg-white" title="Baixar Modelo CSV">
            <Download size={20} />
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

      {/* Students List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 print-only">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Aluno</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Plano / Modalidade</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Contato</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right no-print">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {students.map((student) => (
              <tr
                key={student.id}
                className="hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => handleRowClick(student)}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-sm no-print">
                      {student.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{student.name}</div>
                      <div className="text-xs text-slate-500">Matrícula: {student.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-700">{student.plan}</div>
                  <div className="text-xs text-slate-500">{student.modality}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${student.status === 'Ativo' ? 'bg-green-100 text-green-800' :
                      student.status === 'Inativo' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'}`}>
                    {student.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Phone size={12} /> {student.phone}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-600">
                      <Mail size={12} /> {student.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-right relative no-print">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === student.id ? null : student.id);
                    }}
                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {/* Dropdown Menu */}
                  {openMenuId === student.id && (
                    <div className="absolute right-8 top-8 w-48 bg-white rounded-lg shadow-xl border border-slate-100 z-10 py-1 animate-in fade-in zoom-in-95 duration-200">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(student); }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Edit size={16} /> Editar Cadastro
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate('/finance'); }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <FileText size={16} /> Financeiro
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); /* handleAttendance */ }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Calendar size={16} /> Frequência
                      </button>
                      <div className="h-px bg-slate-100 my-1"></div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(student.id); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <Trash2 size={16} /> Excluir Aluno
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800">
                {isEditing ? 'Editar Aluno' : 'Novo Aluno'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="text-slate-400 hover:text-red-500">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {renderTabNavigation()}

              <form onSubmit={handleSubmit} className="space-y-6">
                {activeTab === 'registration' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    {/* Personal Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nome Completo</label>
                        <input
                          required
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">CPF</label>
                        <input
                          value={formData.cpf}
                          onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Data de Nascimento</label>
                        <input
                          type="date"
                          required
                          value={formData.birthDate}
                          onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={e => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Telefone / WhatsApp</label>
                        <div className="flex gap-2">
                          <input
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          <label className={`flex items-center justify-center px-3 rounded-lg border cursor-pointer transition-colors ${formData.isWhatsapp
                            ? 'bg-green-50 border-green-500 text-green-700'
                            : 'border-slate-300 text-slate-400'
                            }`}>
                            <input
                              type="checkbox"
                              checked={formData.isWhatsapp}
                              onChange={e => setFormData({ ...formData, isWhatsapp: e.target.checked })}
                              className="hidden"
                            />
                            <MessageCircle size={20} />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* Address */}
                    <div className="border-t border-slate-100 pt-6">
                      <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <MapPin size={16} className="text-primary-600" /> Endereço
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">CEP</label>
                          <div className="relative">
                            <input
                              value={formData.address?.cep}
                              onChange={e => handleAddressChange('cep', e.target.value)}
                              onBlur={handleCepBlur}
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            {loadingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" size={16} />}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Rua</label>
                          <input
                            value={formData.address?.street}
                            onChange={e => handleAddressChange('street', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Número</label>
                          <input
                            value={formData.address?.number}
                            onChange={e => handleAddressChange('number', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Bairro</label>
                          <input
                            value={formData.address?.neighborhood}
                            onChange={e => handleAddressChange('neighborhood', e.target.value)}
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Cidade / UF</label>
                          <div className="flex gap-2">
                            <input
                              value={formData.address?.city}
                              onChange={e => handleAddressChange('city', e.target.value)}
                              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            <input
                              value={formData.address?.state}
                              onChange={e => handleAddressChange('state', e.target.value)}
                              className="w-16 px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Guardian Info (if minor) */}
                    {isMinor && (
                      <div className="border-t border-slate-100 pt-6 bg-orange-50 p-4 rounded-lg border border-orange-100">
                        <h4 className="text-sm font-bold text-orange-800 mb-4 flex items-center gap-2">
                          <Shield size={16} /> Responsável Legal (Menor de Idade)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Responsável</label>
                            <input
                              value={formData.guardian?.name}
                              onChange={e => handleGuardianChange('name', e.target.value)}
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">CPF do Responsável</label>
                            <input
                              value={formData.guardian?.cpf}
                              onChange={e => handleGuardianChange('cpf', e.target.value)}
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Telefone</label>
                            <input
                              value={formData.guardian?.phone}
                              onChange={e => handleGuardianChange('phone', e.target.value)}
                              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'enrollment' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Modalidade</label>
                        <select
                          value={formData.modality}
                          onChange={e => setFormData({ ...formData, modality: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                        >
                          <option value="">Selecione...</option>
                          {modalities.map(m => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Plano</label>
                        <select
                          value={formData.plan}
                          onChange={e => setFormData({ ...formData, plan: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                        >
                          <option value="">Selecione...</option>
                          {plans.map(p => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status da Matrícula</label>
                        <select
                          value={formData.status}
                          onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                        >
                          <option value="Ativo">Ativo</option>
                          <option value="Inativo">Inativo</option>
                          <option value="Trancado">Trancado</option>
                        </select>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                      <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Activity size={16} className="text-red-500" /> Ficha Médica / Observações
                      </h4>
                      <textarea
                        rows={4}
                        value={formData.medicalNotes}
                        onChange={e => setFormData({ ...formData, medicalNotes: e.target.value })}
                        placeholder="Alergias, restrições médicas, observações importantes..."
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'documents' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Upload className="mx-auto text-slate-400 mb-3" size={32} />
                      <p className="text-sm font-medium text-slate-700">Clique para fazer upload de documentos</p>
                      <p className="text-xs text-slate-500 mt-1">PDF, JPG ou PNG (Máx. 5MB)</p>
                    </div>

                    <div className="space-y-3">
                      {formData.documents?.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500">
                              <File size={18} />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-700">{doc.name}</p>
                              <p className="text-xs text-slate-500">{doc.uploadDate}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                documents: prev.documents?.filter(d => d.id !== doc.id)
                              }));
                            }}
                            className="text-slate-400 hover:text-red-500 p-2"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowFormModal(false)}
                    className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-2.5 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 transition-colors"
                  >
                    Salvar Aluno
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-lg">
                  {showDetailsModal.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{showDetailsModal.name}</h3>
                  <p className="text-sm text-slate-500">Matrícula: {showDetailsModal.id}</p>
                </div>
              </div>
              <button onClick={() => setShowDetailsModal(null)} className="text-slate-400 hover:text-red-500">
                <X size={24} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Plano Atual</h4>
                  <div className="p-3 bg-primary-50 rounded-lg border border-primary-100">
                    <p className="font-bold text-primary-800">{showDetailsModal.plan}</p>
                    <p className="text-xs text-primary-600">{showDetailsModal.modality}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Status</h4>
                  <div className={`p-3 rounded-lg border ${showDetailsModal.status === 'Ativo' ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'}`}>
                    <p className="font-bold">{showDetailsModal.status}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase mb-3">Informações de Contato</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Phone size={18} />
                    <span>{showDetailsModal.phone} {showDetailsModal.isWhatsapp && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full ml-2">WhatsApp</span>}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <Mail size={18} />
                    <span>{showDetailsModal.email}</span>
                  </div>
                  <div className="flex items-start gap-3 text-slate-600">
                    <MapPin size={18} className="mt-1" />
                    <span>
                      {showDetailsModal.address?.street}, {showDetailsModal.address?.number}
                      <br />
                      {showDetailsModal.address?.neighborhood} - {showDetailsModal.address?.city}/{showDetailsModal.address?.state}
                    </span>
                  </div>
                </div>
              </div>

              {showDetailsModal.medicalNotes && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Observações Médicas</h4>
                  <div className="p-4 bg-red-50 rounded-lg border border-red-100 text-red-800 text-sm">
                    {showDetailsModal.medicalNotes}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => handleOpenEdit(showDetailsModal)}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-700 font-medium hover:bg-slate-50 rounded-lg transition-colors shadow-sm"
              >
                Editar Cadastro
              </button>
              <button
                onClick={() => navigate('/finance?student=' + encodeURIComponent(showDetailsModal.name))}
                className="px-6 py-2 bg-primary-600 text-white font-bold hover:bg-primary-700 rounded-lg transition-colors shadow-lg shadow-primary-200"
              >
                Ver Financeiro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;