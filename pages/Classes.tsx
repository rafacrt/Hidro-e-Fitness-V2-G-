import React, { useState, useEffect } from 'react';
import {
  fetchClasses, fetchModalities, fetchPlans,
  createClass, createModality, createPlan,
  updatePlan, deletePlan, updateModality, deleteModality,
  updateClass, deleteClass
} from '../services/api';
import { ClassSession, Modality } from '../types';
import {
  Clock, Users, Calendar, Plus,
  Settings, DollarSign, Award, MoreVertical, Search, X, Save,
  Upload, Download, Printer, FileText, Edit, Trash, Copy, ArrowUpDown
} from 'lucide-react';
import { exportToCSV, parseCSV, downloadTemplate } from '../utils/csvHelper';
import { LoadingOverlay } from '../components/LoadingOverlay';

type TabType = 'schedule' | 'modalities' | 'plans';

const Classes: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('plans'); // Default to plans
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);

  // Search State
  const [planSearch, setPlanSearch] = useState('');

  // Modal States
  const [showAttendance, setShowAttendance] = useState<number | null>(null);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showModalityModal, setShowModalityModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Edit States
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [editingModality, setEditingModality] = useState<any | null>(null);
  const [editingClass, setEditingClass] = useState<any | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Form States
  const [classForm, setClassForm] = useState({
    name: '', instructor: '', time: '', days: [] as string[], capacity: 20, modalityId: ''
  });
  const [modalityForm, setModalityForm] = useState({
    name: '', targetAudience: 'Adulto', description: '', color: 'bg-blue-500'
  });
  const [planForm, setPlanForm] = useState({
    name: '', modalityId: '', frequency: 'Mensal', price: '', durationMonths: 1, classesPerWeek: 2
  });

  // Bulk Actions State
  const [selectedPlans, setSelectedPlans] = useState<number[]>([]);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenuId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [classesData, modalitiesData, plansData] = await Promise.all([
        fetchClasses(),
        fetchModalities(),
        fetchPlans()
      ]);
      setClasses(classesData);
      setModalities(modalitiesData);
      setPlans(plansData);
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  // --- Helpers ---
  const getModalityName = (id: any) => {
    if (!id) return 'Geral';
    return modalities.find(m => String(m.id) === String(id))?.name || 'Geral';
  };

  const getModalityColor = (id: any) => {
    if (!id) return 'bg-slate-500';
    return modalities.find(m => String(m.id) === String(id))?.color || 'bg-slate-500';
  };

  const normalizeKeys = (row: any, mappings: Record<string, string[]>) => {
    const newRow: any = {};
    Object.keys(row).forEach(key => {
      const lowerKey = key.toLowerCase().trim();
      let found = false;
      for (const [standardKey, aliases] of Object.entries(mappings)) {
        if (aliases.includes(lowerKey) || standardKey.toLowerCase() === lowerKey) {
          newRow[standardKey] = row[key];
          found = true;
          break;
        }
      }
      if (!found) {
        newRow[lowerKey] = row[key];
      }
    });
    return newRow;
  };

  // --- Handlers ---
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClass) {
        await updateClass(editingClass.id, classForm);
        alert('Turma atualizada com sucesso!');
      } else {
        await createClass(classForm);
        alert('Turma criada com sucesso!');
      }
      setShowClassModal(false);
      setEditingClass(null);
      setClassForm({ name: '', instructor: '', time: '', days: [] as string[], capacity: 20, modalityId: '' });
      loadData();
    } catch (error) {
      alert('Erro ao salvar turma');
    }
  };

  const handleCreateModality = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingModality) {
        await updateModality(editingModality.id, modalityForm);
        alert('Modalidade atualizada com sucesso!');
      } else {
        await createModality(modalityForm);
        alert('Modalidade criada com sucesso!');
      }
      setShowModalityModal(false);
      setEditingModality(null);
      setModalityForm({ name: '', targetAudience: 'Adulto', description: '', color: 'bg-blue-500' });
      loadData();
    } catch (error) {
      alert('Erro ao salvar modalidade');
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await updatePlan(editingPlan.id, planForm);
        alert('Plano atualizado com sucesso!');
      } else {
        await createPlan(planForm);
        alert('Plano criado com sucesso!');
      }
      setShowPlanModal(false);
      setEditingPlan(null);
      setPlanForm({ name: '', modalityId: '', frequency: 'Mensal', price: '', durationMonths: 1, classesPerWeek: 2 });
      loadData();
    } catch (error) {
      alert('Erro ao salvar plano');
    }
  };

  // --- Action Handlers ---
  const handleEditPlan = (plan: any) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      modalityId: plan.modalityId || '',
      frequency: plan.frequency,
      price: plan.price,
      durationMonths: plan.durationMonths,
      classesPerWeek: plan.classesPerWeek
    });
    setShowPlanModal(true);
    setActiveMenuId(null);
  };

  const handleDeletePlan = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este plano?')) {
      try {
        await deletePlan(id);
        loadData();
      } catch (error) {
        alert('Erro ao excluir plano');
      }
    }
    setActiveMenuId(null);
  };

  const handleDuplicatePlan = async (plan: any) => {
    try {
      const newPlan = { ...plan, name: `${plan.name} (Cópia)` };
      delete newPlan.id;
      await createPlan(newPlan);
      loadData();
      alert('Plano duplicado com sucesso!');
    } catch (error) {
      alert('Erro ao duplicar plano');
    }
    setActiveMenuId(null);
  };

  const handleEditModality = (modality: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingModality(modality);
    setModalityForm({
      name: modality.name,
      targetAudience: modality.targetAudience,
      description: modality.description,
      color: modality.color
    });
    setShowModalityModal(true);
  };

  const handleDeleteModality = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir esta modalidade?')) {
      try {
        await deleteModality(id);
        loadData();
      } catch (error: any) {
        alert(error.message || 'Erro ao excluir modalidade');
      }
    }
  };

  const handleDuplicateModality = async (modality: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newModality = { ...modality, name: `${modality.name} (Cópia)` };
      delete newModality.id;
      await createModality(newModality);
      loadData();
      alert('Modalidade duplicada com sucesso!');
    } catch (error) {
      alert('Erro ao duplicar modalidade');
    }
  };

  const handleEditClass = (cls: any) => {
    setEditingClass(cls);
    setClassForm({
      name: cls.name,
      instructor: cls.instructor,
      time: cls.time,
      days: cls.days,
      capacity: cls.capacity,
      modalityId: cls.modalityId
    });
    setShowClassModal(true);
    setActiveMenuId(null);
  };

  const handleDeleteClass = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta turma?')) {
      try {
        await deleteClass(id);
        loadData();
      } catch (error) {
        alert('Erro ao excluir turma');
      }
    }
    setActiveMenuId(null);
  };

  const handleDuplicateClass = async (cls: any) => {
    try {
      const newClass = { ...cls, name: `${cls.name} (Cópia)` };
      delete newClass.id;
      await createClass(newClass);
      loadData();
      alert('Turma duplicada com sucesso!');
    } catch (error) {
      alert('Erro ao duplicar turma');
    }
    setActiveMenuId(null);
  };

  const toggleDay = (day: string) => {
    setClassForm(prev => {
      const days = prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day];
      return { ...prev, days };
    });
  };

  // --- Export/Import Handlers ---
  const handleExportModalities = () => {
    const headers = ['name', 'targetAudience', 'description', 'color'];
    const data = modalities.map(m => ({
      name: m.name,
      targetAudience: m.targetAudience,
      description: m.description,
      color: m.color
    }));
    exportToCSV(data, headers, 'modalidades');
  };

  const handleImportModalities = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImporting(true);
      try {
        const parsedData = await parseCSV(e.target.files[0]);
        if (parsedData.length === 0) {
          alert('O arquivo CSV está vazio.');
          return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const rawRow of parsedData) {
          const row = normalizeKeys(rawRow, {
            name: ['nome', 'modalidade', 'name'],
            targetAudience: ['publico', 'público', 'publico_alvo', 'targetaudience', 'target_audience'],
            description: ['descricao', 'descrição', 'description'],
            color: ['cor', 'color']
          });

          if (!row.name) {
            console.warn('Linha ignorada por falta de nome:', row);
            errorCount++;
            continue;
          }

          try {
            await createModality({
              name: row.name,
              targetAudience: row.targetAudience || 'Adulto',
              description: row.description || '',
              color: row.color || 'bg-blue-500'
            });
            successCount++;
          } catch (err) {
            console.error('Erro ao criar modalidade:', row.name, err);
            errorCount++;
          }
        }
        alert(`Importação concluída!\nSucesso: ${successCount}\nErros: ${errorCount}`);
        loadData();
      } catch (error) {
        console.error('Erro fatal na importação:', error);
        alert('Erro ao processar o arquivo CSV. Verifique o formato.');
      } finally {
        setImporting(false);
      }
      e.target.value = '';
    }
  };

  const handleExportPlans = () => {
    const headers = ['name', 'modalityName', 'frequency', 'price', 'durationMonths', 'classesPerWeek'];
    const data = plans.map(p => ({
      name: p.name,
      modalityName: getModalityName(p.modalityId),
      frequency: p.frequency,
      price: p.price,
      durationMonths: p.durationMonths,
      classesPerWeek: p.classesPerWeek
    }));
    exportToCSV(data, headers, 'planos');
  };

  const handleImportPlans = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImporting(true);
      try {
        const parsedData = await parseCSV(e.target.files[0]);
        if (parsedData.length === 0) {
          alert('O arquivo CSV está vazio.');
          return;
        }

        let successCount = 0;
        let errorCount = 0;

        for (const rawRow of parsedData) {
          const row = normalizeKeys(rawRow, {
            name: ['nome', 'plano', 'name'],
            modalityName: ['modalidade', 'modalityname', 'modality_name'],
            frequency: ['frequencia', 'frequência', 'frequency'],
            price: ['preco', 'preço', 'valor', 'price'],
            durationMonths: ['duracao', 'duração', 'duracao_meses', 'durationmonths', 'duration_months'],
            classesPerWeek: ['aulas', 'aulas_semana', 'classesperweek', 'classes_per_week', 'aulas/semana', 'aulas por semana', 'qtd_aulas', 'frequencia_semanal']
          });

          if (!row.name || !row.price) {
            console.warn('Linha ignorada por falta de nome ou preço:', row);
            errorCount++;
            continue;
          }

          const modality = modalities.find(m => m.name.toLowerCase() === (row.modalityName || '').toLowerCase());

          const frequencyMap: { [key: string]: string } = {
            'ANUAL': 'Anual',
            'MENSAL': 'Mensal',
            'SEMANAL': 'Semanal',
            'TRIMESTRAL': 'Trimestral',
            'SEMESTRAL': 'Semestral',
            'BIMESTRAL': 'Bimestral'
          };
          const rawFrequency = (row.frequency || 'Mensal').toUpperCase();
          const frequency = frequencyMap[rawFrequency] || row.frequency || 'Mensal';

          try {
            await createPlan({
              name: row.name,
              modalityId: modality ? modality.id : undefined,
              frequency: frequency,
              price: row.price.toString().replace(',', '.'),
              durationMonths: parseInt(row.durationMonths) || 1,
              classesPerWeek: parseInt(row.classesPerWeek) || 2
            });
            successCount++;
          } catch (err: any) {
            console.error('Erro ao criar plano:', row.name, err);
            errorCount++;
          }
        }

        let msg = `Importação concluída!\nSucesso: ${successCount}\nErros: ${errorCount}`;
        if (errorCount > 0) {
          msg += `\n\nVerifique o console (F12) para detalhes dos erros.`;
        }
        alert(msg);
        loadData();
      } catch (error: any) {
        console.error('Erro fatal na importação:', error);
        alert(`Erro ao processar o arquivo CSV: ${error.message || 'Erro desconhecido'}`);
      } finally {
        setImporting(false);
      }
      e.target.value = '';
    }
  };

  const handleDownloadTemplateModality = () => {
    downloadTemplate(['name', 'targetAudience', 'description', 'color'], 'modalidades');
  };

  const handleDownloadTemplatePlan = () => {
    downloadTemplate(['name', 'modalityName', 'frequency', 'price', 'durationMonths', 'classesPerWeek'], 'planos');
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
          onClick={() => {
            setEditingClass(null);
            setClassForm({ name: '', instructor: '', time: '', days: [], capacity: 20, modalityId: '' });
            setShowClassModal(true);
          }}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-lg shadow-primary-200 flex items-center gap-2 text-sm font-medium"
        >
          <Plus size={16} /> Nova Turma
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {classes.map((cls) => {
          const percentage = Math.round((cls.enrolled / cls.capacity) * 100);
          const isFull = percentage >= 100;
          const modColor = getModalityColor(cls.modalityId);

          return (
            <div key={cls.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 hover:border-primary-300 transition-all flex flex-col md:flex-row items-center gap-6 relative overflow-hidden">
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${modColor.replace('bg-', 'bg-')}`}></div>

              <div className="flex-shrink-0 w-full md:w-32 text-center md:text-left pl-2">
                <div className="flex items-center justify-center md:justify-start gap-2 text-slate-800 font-bold text-lg">
                  {cls.time}
                </div>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">
                  {cls.days.join(' · ')}
                </div>
              </div>

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

              <div className="flex gap-2 border-t md:border-t-0 md:border-l border-slate-100 pt-3 md:pt-0 md:pl-4 w-full md:w-auto justify-center relative">
                <button
                  onClick={() => setShowAttendance(cls.id)}
                  className="px-3 py-1.5 text-xs font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                >
                  Chamada
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuId(activeMenuId === `class-${cls.id}` ? null : `class-${cls.id}`);
                  }}
                  className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <MoreVertical size={18} />
                </button>

                {activeMenuId === `class-${cls.id}` && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-slate-100 py-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEditClass(cls); }}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Edit size={14} /> Editar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDuplicateClass(cls); }}
                      className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                    >
                      <Copy size={14} /> Duplicar
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id); }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash size={14} /> Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {classes.length === 0 && (
          <div className="text-center py-10 text-slate-500">Nenhuma turma encontrada.</div>
        )}
      </div>
    </div>
  );

  // --- Render: Modalities Tab ---
  const renderModalities = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Award className="text-purple-600" size={20} />
          Modalidades Esportivas
        </h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExportModalities} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200" title="Exportar CSV">
            <FileText size={18} />
          </button>
          <button onClick={() => window.print()} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200" title="Imprimir">
            <Printer size={18} />
          </button>
          <label className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer" title="Importar CSV">
            <Upload size={18} />
            <input type="file" accept=".csv" className="hidden" onChange={handleImportModalities} />
          </label>
          <button onClick={handleDownloadTemplateModality} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200" title="Baixar Modelo">
            <Download size={18} />
          </button>
          <button
            onClick={() => {
              setEditingModality(null);
              setModalityForm({ name: '', targetAudience: 'Adulto', description: '', color: 'bg-blue-500' });
              setShowModalityModal(true);
            }}
            className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 text-sm font-medium flex items-center gap-2"
          >
            <Plus size={16} /> Nova Modalidade
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print-only">
        {modalities.map((mod) => (
          <div
            key={mod.id}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 relative group hover:shadow-md transition-all cursor-pointer"
            onClick={(e) => handleEditModality(mod, e)}
          >
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
              <div className="flex gap-2 no-print">
                <button
                  onClick={(e) => handleDuplicateModality(mod, e)}
                  className="text-slate-400 hover:text-primary-600 p-1"
                  title="Duplicar"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={(e) => handleDeleteModality(mod.id, e)}
                  className="text-slate-400 hover:text-red-600 p-1"
                  title="Excluir"
                >
                  <Trash size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {modalities.length === 0 && (
          <div className="col-span-full text-center py-10 text-slate-500">Nenhuma modalidade encontrada.</div>
        )}
      </div>
    </div>
  );

  // --- Bulk Action Handlers ---
  const handleSelectPlan = (id: number) => {
    setSelectedPlans(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleSelectAllPlans = () => {
    if (selectedPlans.length === plans.length) {
      setSelectedPlans([]);
    } else {
      setSelectedPlans(plans.map(p => p.id));
    }
  };

  const handleBulkDeletePlans = async () => {
    if (selectedPlans.length === 0) return;

    if (window.confirm(`Tem certeza que deseja excluir ${selectedPlans.length} planos selecionados?`)) {
      setLoading(true);
      let errorCount = 0;
      for (const id of selectedPlans) {
        try {
          await deletePlan(id);
        } catch (error) {
          console.error(`Erro ao excluir plano ${id}`, error);
          errorCount++;
        }
      }
      await loadData();
      setSelectedPlans([]);
      setLoading(false);
      if (errorCount > 0) {
        alert(`Operação concluída com ${errorCount} erros.`);
      } else {
        alert('Planos excluídos com sucesso!');
      }
    }
  };


  // --- Sorting Logic ---
  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedPlans = React.useMemo(() => {
    let sortableItems = [...plans];

    // Filter by search
    if (planSearch) {
      const searchLower = planSearch.toLowerCase();
      sortableItems = sortableItems.filter(p =>
        p.name.toLowerCase().includes(searchLower) ||
        getModalityName(p.modalityId).toLowerCase().includes(searchLower)
      );
    }

    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aValue: any = a[sortConfig.key];
        let bValue: any = b[sortConfig.key];

        // Custom handling for specific columns
        if (sortConfig.key === 'modalityName') {
          aValue = getModalityName(a.modalityId).toLowerCase();
          bValue = getModalityName(b.modalityId).toLowerCase();
        } else if (sortConfig.key === 'price') {
          aValue = Number(a.price);
          bValue = Number(b.price);
        } else if (sortConfig.key === 'classesPerWeek') {
          aValue = Number(a.classesPerWeek);
          bValue = Number(b.classesPerWeek);
        } else if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [plans, sortConfig, modalities]);

  // Bulk Edit State
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [bulkEdits, setBulkEdits] = useState<Record<number, { price: string }>>({});
  const [adjustmentValue, setAdjustmentValue] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'percentage' | 'fixed'>('percentage');

  // --- Handlers ---
  const handleBulkEditChange = (id: number, field: 'price', value: string) => {
    setBulkEdits(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const handleGlobalAdjustment = () => {
    const val = parseFloat(adjustmentValue);
    if (isNaN(val) || val === 0) return;

    const newEdits: Record<number, { price: string }> = {};

    sortedPlans.forEach(plan => {
      const dbPrice = plan.price !== undefined && plan.price !== null ? plan.price : 0;
      let currentPrice = parseFloat(bulkEdits[plan.id]?.price || String(dbPrice));
      if (isNaN(currentPrice)) currentPrice = 0;

      let newPrice = currentPrice;

      if (adjustmentType === 'percentage') {
        newPrice = currentPrice * (1 + val / 100);
      } else {
        newPrice = currentPrice + val;
      }

      newEdits[plan.id] = { price: newPrice.toFixed(2) };
    });

    setBulkEdits(prev => ({ ...prev, ...newEdits }));
    alert(`Reajuste aplicado em ${Object.keys(newEdits).length} planos. Clique em Salvar para confirmar.`);
  };

  const handleSaveBulkEdits = async () => {
    setLoading(true);
    let successCount = 0;
    let errorCount = 0;

    const updates = Object.entries(bulkEdits);
    if (updates.length === 0) {
      setIsBulkEditing(false);
      setLoading(false);
      return;
    }

    try {
      await Promise.all(updates.map(async ([idStr, changes]: [string, { price: string }]) => {
        const id = parseInt(idStr);
        const originalPlan = plans.find(p => p.id === id);
        if (!originalPlan) return;

        // Merge original data with changes to respect required fields
        const updatedPlan = {
          ...originalPlan,
          price: parseFloat(changes.price),
          // Ensure we send all required fields for update
          modalityId: originalPlan.modalityId || null
        };

        // Remove ID from body if API implementation requires it (usually put ignores ID in body or uses it)
        // Check api.ts updatePlan implementation if needed, usually it takes (id, data)

        try {
          await updatePlan(id, updatedPlan);
          successCount++;
        } catch (e) {
          console.error(`Failed to update plan ${id}`, e);
          errorCount++;
        }
      }));

      await loadData();
      setIsBulkEditing(false);
      setBulkEdits({});
      alert(`Edição em massa concluída!\nAtualizados: ${successCount}\nErros: ${errorCount}`);
    } catch (error) {
      console.error("Bulk save error", error);
      alert("Erro crítico ao salvar alterações.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBulkEdit = () => {
    setIsBulkEditing(false);
    setBulkEdits({});
    setAdjustmentValue('');
  };

  // --- Render: Plans Tab ---
  const renderPlans = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <DollarSign className="text-green-600" size={20} />
          Planos e Preços
        </h3>

        <div className="flex-1 max-w-xs mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar planos..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              value={planSearch}
              onChange={(e) => setPlanSearch(e.target.value)}
            />
          </div>
        </div>

        {isBulkEditing ? (
          <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 bg-yellow-50 p-2 rounded-lg border border-yellow-100">
            <div className="flex items-center gap-2 mr-4 border-r border-yellow-200 pr-4">
              <span className="text-xs font-bold text-yellow-800 uppercase">Reajuste Global:</span>
              <select
                value={adjustmentType}
                onChange={e => setAdjustmentType(e.target.value as any)}
                className="text-sm border-yellow-200 rounded px-2 py-1 bg-white text-slate-700"
              >
                <option value="percentage">Porcentagem (%)</option>
                <option value="fixed">Valor Fixo (R$)</option>
              </select>
              <input
                type="number"
                placeholder={adjustmentType === 'percentage' ? "Ex: 10" : "Ex: 5.00"}
                value={adjustmentValue}
                onChange={e => setAdjustmentValue(e.target.value)}
                className="w-24 text-sm border-yellow-200 rounded px-2 py-1"
              />
              <button
                onClick={handleGlobalAdjustment}
                className="p-1 px-3 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300 text-sm font-bold"
              >
                Aplicar
              </button>
            </div>

            <button
              onClick={handleCancelBulkEdit}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveBulkEdits}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md flex items-center gap-2 text-sm font-medium"
            >
              <Save size={16} /> Salvar Alterações
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {selectedPlans.length > 0 && (
              <button
                onClick={handleBulkDeletePlans}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-sm flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2"
              >
                <Trash size={16} /> Excluir ({selectedPlans.length})
              </button>
            )}
            <button
              onClick={() => setIsBulkEditing(true)}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg hover:bg-indigo-100 flex items-center gap-2 text-sm font-medium"
            >
              <Edit size={16} /> Edição em Massa
            </button>
            <button onClick={handleExportPlans} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200" title="Exportar CSV">
              <FileText size={18} />
            </button>
            <button onClick={() => window.print()} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200" title="Imprimir">
              <Printer size={18} />
            </button>
            <label className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer" title="Importar CSV">
              <Upload size={18} />
              <input type="file" accept=".csv" className="hidden" onChange={handleImportPlans} />
            </label>
            <button onClick={handleDownloadTemplatePlan} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200" title="Baixar Modelo">
              <Download size={18} />
            </button>
            <button
              onClick={() => {
                setEditingPlan(null);
                setPlanForm({ name: '', modalityId: '', frequency: 'Mensal', price: '', durationMonths: 1, classesPerWeek: 2 });
                setShowPlanModal(true);
              }}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 shadow-lg flex items-center gap-2 text-sm font-medium"
            >
              <Plus size={16} /> Novo Plano
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 print-only">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 w-10 no-print">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                  checked={plans.length > 0 && selectedPlans.length === plans.length}
                  onChange={handleSelectAllPlans}
                  disabled={isBulkEditing}
                />
              </th>
              <th
                className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => !isBulkEditing && requestSort('name')}
              >
                <div className="flex items-center gap-1">
                  Nome do Plano
                  <ArrowUpDown size={14} className={`text-slate-400 ${sortConfig?.key === 'name' ? 'text-primary-600' : 'opacity-0 group-hover:opacity-100'}`} />
                </div>
              </th>
              <th
                className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => !isBulkEditing && requestSort('modalityName')}
              >
                <div className="flex items-center gap-1">
                  Modalidade
                  <ArrowUpDown size={14} className={`text-slate-400 ${sortConfig?.key === 'modalityName' ? 'text-primary-600' : 'opacity-0 group-hover:opacity-100'}`} />
                </div>
              </th>
              <th
                className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => requestSort('frequency')}
              >
                <div className="flex items-center gap-1">
                  Frequência
                  <ArrowUpDown size={14} className={`text-slate-400 ${sortConfig?.key === 'frequency' ? 'text-primary-600' : 'opacity-0 group-hover:opacity-100'}`} />
                </div>
              </th>
              <th
                className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-center cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => requestSort('classesPerWeek')}
              >
                <div className="flex items-center justify-center gap-1">
                  Aulas/Semana
                  <ArrowUpDown size={14} className={`text-slate-400 ${sortConfig?.key === 'classesPerWeek' ? 'text-primary-600' : 'opacity-0 group-hover:opacity-100'}`} />
                </div>
              </th>
              <th
                className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 transition-colors group"
                onClick={() => requestSort('price')}
              >
                <div className="flex items-center gap-1">
                  Valor
                  <ArrowUpDown size={14} className={`text-slate-400 ${sortConfig?.key === 'price' ? 'text-primary-600' : 'opacity-0 group-hover:opacity-100'}`} />
                </div>
              </th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right no-print">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedPlans.map((plan) => (
              <tr
                key={plan.id}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => handleEditPlan(plan)}
              >
                <td className="px-6 py-4 w-10 no-print" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    checked={selectedPlans.includes(plan.id)}
                    onChange={() => handleSelectPlan(plan.id)}
                  />
                </td>
                <td className="px-6 py-4 font-medium text-slate-900">{plan.name}</td>
                <td className="px-6 py-4 text-slate-600 text-sm">{getModalityName(plan.modalityId)}</td>
                <td className="px-6 py-4 text-slate-600 text-sm">
                  <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold uppercase text-slate-600">
                    {plan.frequency}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600 text-sm text-center">
                  {plan.classesPerWeek}x
                </td>
                <td className="px-6 py-4 font-bold text-green-700">
                  {isBulkEditing ? (
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={bulkEdits[plan.id]?.price !== undefined ? bulkEdits[plan.id].price : plan.price}
                        onChange={(e) => handleBulkEditChange(plan.id, 'price', e.target.value)}
                        className={`w-32 pl-8 pr-2 py-1 border rounded focus:ring-2 focus:ring-primary-500 focus:outline-none ${bulkEdits[plan.id] ? 'border-primary-500 bg-primary-50' : 'border-slate-300'}`}
                      />
                    </div>
                  ) : (
                    `R$ ${Number(plan.price).toFixed(2)}`
                  )}
                </td>
                <td className="px-6 py-4 text-right no-print relative">
                  {!isBulkEditing && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === `plan-${plan.id}` ? null : `plan-${plan.id}`);
                        }}
                        className="text-slate-400 hover:text-primary-600 p-1"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {activeMenuId === `plan-${plan.id}` && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-slate-100 py-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditPlan(plan); }}
                            className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Edit size={14} /> Editar
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDuplicatePlan(plan); }}
                            className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Copy size={14} /> Duplicar
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }}
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash size={14} /> Excluir
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
            {plans.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-10 text-slate-500">Nenhum plano encontrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-only, .print-only * {
            visibility: visible;
            position: static;
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

      {/* Top Navigation Tabs */}
      <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex mb-2 no-print">
        <button
          onClick={() => setActiveTab('plans')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'plans' ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Planos
        </button>
        <button
          onClick={() => setActiveTab('modalities')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'modalities' ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Modalidades
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'schedule' ? 'bg-primary-50 text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Grade de Horários
        </button>
      </div>

      {activeTab === 'plans' && renderPlans()}
      {activeTab === 'modalities' && renderModalities()}
      {activeTab === 'schedule' && renderSchedule()}

      <LoadingOverlay isVisible={importing} message="Importando arquivo..." />

      {/* Modals */}
      {showClassModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{editingClass ? 'Editar Turma' : 'Nova Turma'}</h3>
              <button onClick={() => setShowClassModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateClass} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome da Turma</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={classForm.name}
                  onChange={e => setClassForm({ ...classForm, name: e.target.value })}
                  placeholder="Ex: Hidroginástica Manhã"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Horário</label>
                  <input
                    type="time"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={classForm.time}
                    onChange={e => setClassForm({ ...classForm, time: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Capacidade</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={classForm.capacity}
                    onChange={e => setClassForm({ ...classForm, capacity: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Instrutor</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={classForm.instructor}
                  onChange={e => setClassForm({ ...classForm, instructor: e.target.value })}
                  placeholder="Nome do instrutor"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Modalidade</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={classForm.modalityId}
                  onChange={e => setClassForm({ ...classForm, modalityId: e.target.value })}
                  required
                >
                  <option value="">Selecione...</option>
                  {modalities.map(mod => (
                    <option key={mod.id} value={mod.id}>{mod.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Dias da Semana</label>
                <div className="flex flex-wrap gap-2">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`px-3 py-1 text-sm rounded-full border transition-colors ${classForm.days.includes(day)
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-primary-400'
                        }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowClassModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2"
                >
                  <Save size={18} /> Salvar Turma
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModalityModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{editingModality ? 'Editar Modalidade' : 'Nova Modalidade'}</h3>
              <button onClick={() => setShowModalityModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateModality} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={modalityForm.name}
                  onChange={e => setModalityForm({ ...modalityForm, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Público Alvo</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={modalityForm.targetAudience}
                  onChange={e => setModalityForm({ ...modalityForm, targetAudience: e.target.value })}
                >
                  <option value="Adulto">Adulto</option>
                  <option value="Infantil">Infantil</option>
                  <option value="Idoso">Idoso</option>
                  <option value="Bebê">Bebê</option>
                  <option value="Todos">Todos</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Descrição</label>
                <textarea
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  value={modalityForm.description}
                  onChange={e => setModalityForm({ ...modalityForm, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cor de Identificação</label>
                <div className="grid grid-cols-5 gap-2">
                  {['bg-blue-500', 'bg-teal-500', 'bg-purple-500', 'bg-orange-500', 'bg-red-500', 'bg-indigo-500', 'bg-pink-500', 'bg-green-500', 'bg-yellow-500', 'bg-slate-500'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setModalityForm({ ...modalityForm, color })}
                      className={`w-8 h-8 rounded-full ${color} ${modalityForm.color === color ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}
                    />
                  ))}
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModalityModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2"
                >
                  <Save size={18} /> Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800">{editingPlan ? 'Editar Plano' : 'Novo Plano'}</h3>
              <button onClick={() => setShowPlanModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreatePlan} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Plano</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={planForm.name}
                  onChange={e => setPlanForm({ ...planForm, name: e.target.value })}
                  placeholder="Ex: Musculação Mensal"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Modalidade</label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={planForm.modalityId}
                  onChange={e => setPlanForm({ ...planForm, modalityId: e.target.value })}
                >
                  <option value="">Geral (Sem modalidade específica)</option>
                  {modalities.map(mod => (
                    <option key={mod.id} value={mod.id}>{mod.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Frequência</label>
                  <select
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={planForm.frequency}
                    onChange={e => setPlanForm({ ...planForm, frequency: e.target.value })}
                  >
                    <option value="Semanal">Semanal</option>
                    <option value="Mensal">Mensal</option>
                    <option value="Bimestral">Bimestral</option>
                    <option value="Trimestral">Trimestral</option>
                    <option value="Semestral">Semestral</option>
                    <option value="Anual">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={planForm.price}
                    onChange={e => setPlanForm({ ...planForm, price: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duração (Meses)</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={planForm.durationMonths}
                    onChange={e => setPlanForm({ ...planForm, durationMonths: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Aulas/Semana</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    value={planForm.classesPerWeek}
                    onChange={e => setPlanForm({ ...planForm, classesPerWeek: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPlanModal(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium flex items-center gap-2"
                >
                  <Save size={18} /> Salvar Plano
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;