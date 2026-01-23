import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { fetchStudents, fetchPlans, fetchModalities, fetchUsers, fetchClasses, fetchTransactions } from '../services/api'; // We'll need to ensuring this exports correctly or fetch directly
import { Download, Database, FileArchive, Loader2 } from 'lucide-react';

const DeveloperBackup: React.FC = () => {
    const [loading, setLoading] = useState(false);

    const handleBackup = async () => {
        try {
            setLoading(true);

            // 1. Fetch data
            const [students, plans, modalities, users, classes, transactions] = await Promise.all([
                fetchStudents(),
                fetchPlans(),
                fetchModalities(),
                fetchUsers(),
                fetchClasses(),
                fetchTransactions()
            ]);

            const zip = new JSZip();

            // --- ALUNOS CSV ---
            if (students && students.length > 0) {
                const sHeaders = [
                    'ID', 'Nome', 'Email', 'CPF', 'RG', 'Data Nascimento', 'Telefone',
                    'Whatsapp', 'Plano', 'Modalidades', 'Status', 'CEP', 'Rua', 'Número',
                    'Bairro', 'Cidade', 'Estado', 'Complemento', 'Responsável Nome',
                    'Responsável CPF', 'Responsável Telefone', 'Relacionamento', 'Notas Médicas'
                ];
                const sRows = [sHeaders.join(';')];
                const dRows = [['Student ID', 'Doc ID', 'Nome Arquivo', 'Tipo', 'Data Upload'].join(';')]; // Header for Documents

                students.forEach((s: any) => {
                    // Fix: Handle plan field correctly. If it's "[]" string or empty array, output empty string.
                    let planVal = s.plan;
                    if (Array.isArray(planVal)) planVal = planVal.length ? planVal.join(', ') : '';
                    if (planVal === '[]') planVal = '';
                    if (!planVal) planVal = '';

                    const row = [
                        s.id,
                        `"${s.name || ''}"`,
                        `"${s.email || ''}"`,
                        `"${s.cpf || ''}"`,
                        `"${s.rg || ''}"`,
                        s.birthDate || '',
                        `"${s.phone || ''}"`,
                        s.isWhatsapp ? 'Sim' : 'Não',
                        `"${planVal}"`,
                        `"${Array.isArray(s.modalities) ? s.modalities.join(', ') : (s.modalities || '')}"`,
                        s.status || '',
                        s.address?.cep || '',
                        `"${s.address?.street || ''}"`,
                        s.address?.number || '',
                        `"${s.address?.neighborhood || ''}"`,
                        `"${s.address?.city || ''}"`,
                        s.address?.state || '',
                        `"${s.address?.complement || ''}"`,
                        `"${s.guardian?.name || ''}"`,
                        `"${s.guardian?.cpf || ''}"`,
                        `"${s.guardian?.phone || ''}"`,
                        `"${s.guardian?.relationship || ''}"`,
                        `"${s.medicalNotes?.replace(/"/g, '""') || ''}"`
                    ];
                    sRows.push(row.join(';'));

                    // Check for documents
                    if (s.documents && Array.isArray(s.documents)) {
                        s.documents.forEach((d: any) => {
                            dRows.push([
                                s.id,
                                d.id,
                                `"${d.name || ''}"`,
                                d.type,
                                d.uploadDate
                            ].join(';'));
                        });
                    }
                });
                // Add BOM for Excel UTF-8 compatibility
                zip.file('alunos.csv', '\uFEFF' + sRows.join('\n'));
                if (dRows.length > 1) {
                    zip.file('documentos_alunos.csv', '\uFEFF' + dRows.join('\n'));
                }
            }

            // --- PLANOS CSV ---
            if (plans && plans.length > 0) {
                const pHeaders = ['ID', 'Nome', 'Modalidade ID', 'Frequência', 'Preço', 'Duração (Meses)', 'Aulas/Semana'];
                const pRows = [pHeaders.join(';')];
                plans.forEach((p: any) => {
                    const row = [
                        p.id,
                        `"${p.name || ''}"`,
                        p.modalityId || '',
                        p.frequency || '',
                        p.price || '',
                        p.durationMonths || '',
                        p.classesPerWeek || ''
                    ];
                    pRows.push(row.join(';'));
                });
                zip.file('planos.csv', '\uFEFF' + pRows.join('\n'));
            }

            // --- MODALIDADES CSV ---
            if (modalities && modalities.length > 0) {
                const mHeaders = ['ID', 'Nome', 'Público Alvo', 'Descrição', 'Cor'];
                const mRows = [mHeaders.join(';')];
                modalities.forEach((m: any) => {
                    const row = [
                        m.id,
                        `"${m.name || ''}"`,
                        `"${m.targetAudience || ''}"`,
                        `"${m.description || ''}"`,
                        m.color || ''
                    ];
                    mRows.push(row.join(';'));
                });
                zip.file('modalidades.csv', '\uFEFF' + mRows.join('\n'));
            }

            // --- TURMAS CSV ---
            if (classes && classes.length > 0) {
                const cHeaders = ['ID', 'Nome', 'Horário Início', 'Horário Fim', 'Dias', 'Instrutor', 'Capacidade', 'Matriculados', 'ID Modalidade', 'Status'];
                const cRows = [cHeaders.join(';')];
                classes.forEach((c: any) => {
                    const row = [
                        c.id,
                        `"${c.name || ''}"`,
                        c.time || '',
                        c.endTime || '',
                        `"${Array.isArray(c.days) ? c.days.join(', ') : c.days}"`,
                        `"${c.instructor || ''}"`,
                        c.capacity || '',
                        c.enrolled || '',
                        c.modalityId || '',
                        c.status || ''
                    ];
                    cRows.push(row.join(';'));
                });
                zip.file('turmas.csv', '\uFEFF' + cRows.join('\n'));
            }

            // --- FINANCEIRO CSV ---
            if (transactions && transactions.length > 0) {
                const fHeaders = ['ID', 'Data', 'Data Vencimento', 'Descrição', 'Tipo', 'Categoria', 'Valor', 'Status', 'Entidade Relacionada'];
                const fRows = [fHeaders.join(';')];
                transactions.forEach((t: any) => {
                    const row = [
                        t.id,
                        t.date || '',
                        t.dueDate || '',
                        `"${t.description || ''}"`,
                        t.type || '',
                        t.category || '',
                        t.amount || '',
                        t.status || '',
                        `"${t.relatedEntity || ''}"`
                    ];
                    fRows.push(row.join(';'));
                });
                zip.file('financeiro.csv', '\uFEFF' + fRows.join('\n'));
            }

            // --- USUARIOS CSV ---
            if (users && users.length > 0) {
                const uHeaders = ['ID', 'Nome', 'Email', 'Role'];
                const uRows = [uHeaders.join(';')];
                users.forEach((u: any) => {
                    const row = [
                        u.id,
                        `"${u.name || ''}"`,
                        `"${u.email || ''}"`,
                        u.role || ''
                    ];
                    uRows.push(row.join(';'));
                });
                zip.file('usuarios.csv', '\uFEFF' + uRows.join('\n'));
            }


            // 4. Download
            const date = new Date().toISOString().split('T')[0];
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `backup_sistema_completo_${date}.zip`);

            alert('Backup COMPLETO concluído com sucesso!');

        } catch (error) {
            console.error('Erro ao gerar backup:', error);
            alert('Erro ao gerar backup. Verifique o console.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4">
            <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                <Database className="text-primary-600" />
                Área do Desenvolvedor - Backup
            </h1>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
                <div className="flex flex-col items-center justify-center text-center space-y-6">
                    <div className="p-4 bg-primary-50 rounded-full">
                        <FileArchive size={48} className="text-primary-600" />
                    </div>

                    <div className="max-w-md">
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Exportar Dados do Sistema</h2>
                        <p className="text-slate-500">
                            Gera um arquivo ZIP contendo:
                            <br />- Alunos e Documentos (CSV)
                            <br />- Planos e Modalidades (CSV)
                            <br />- Turmas (CSV)
                            <br />- Financeiro (CSV)
                            <br />- Usuários (CSV)
                        </p>
                    </div>

                    <button
                        onClick={handleBackup}
                        disabled={loading}
                        className="px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 font-bold flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed transition-all transform active:scale-95"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Gerando Backup...
                            </>
                        ) : (
                            <>
                                <Download size={20} />
                                Baixar Backup Completo (.zip)
                            </>
                        )}
                    </button>

                    <p className="text-xs text-slate-400 mt-4">
                        * O arquivo contém informações sensíveis. Armazene com segurança.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DeveloperBackup;
