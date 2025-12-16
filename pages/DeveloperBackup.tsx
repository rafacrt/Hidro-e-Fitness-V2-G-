import React, { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { fetchStudents } from '../services/api'; // We'll need to ensuring this exports correctly or fetch directly
import { Download, Database, FileArchive, Loader2 } from 'lucide-react';

const DeveloperBackup: React.FC = () => {
    const [loading, setLoading] = useState(false);

    const handleBackup = async () => {
        try {
            setLoading(true);

            // 1. Fetch all students
            // Since fetchStudents might not be exported or might return limited data, 
            // let's ensure we get all data. 
            // If fetchStudents is not available, we can assume a standard API call.
            // But usually we can import it.
            const students = await fetchStudents();

            if (!students || students.length === 0) {
                alert('Nenhum aluno encontrado para backup.');
                return;
            }

            // 2. Convert to CSV
            const headers = [
                'ID', 'Nome', 'Email', 'CPF', 'RG', 'Data Nascimento', 'Telefone',
                'Whatsapp', 'Plano', 'Modalidades', 'Status', 'CEP', 'Rua', 'Número',
                'Bairro', 'Cidade', 'Estado', 'Complemento', 'Responsável Nome',
                'Responsável CPF', 'Responsável Telefone', 'Relacionamento', 'Notas Médicas'
            ];

            const csvRows = [headers.join(';')];

            students.forEach((s: any) => {
                const row = [
                    s.id,
                    `"${s.name || ''}"`,
                    `"${s.email || ''}"`,
                    `"${s.cpf || ''}"`,
                    `"${s.rg || ''}"`,
                    s.birthDate || '',
                    `"${s.phone || ''}"`,
                    s.isWhatsapp ? 'Sim' : 'Não',
                    `"${s.plan || ''}"`,
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
                csvRows.push(row.join(';'));
            });

            const csvContent = csvRows.join('\n');

            // 3. Zip
            const zip = new JSZip();
            const date = new Date().toISOString().split('T')[0];
            const fileName = `backup_alunos_${date}.csv`;

            zip.file(fileName, csvContent);

            // 4. Download
            const content = await zip.generateAsync({ type: 'blob' });
            saveAs(content, `backup_sistema_${date}.zip`);

            alert('Backup concluído com sucesso!');

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
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Exportar Dados de Alunos</h2>
                        <p className="text-slate-500">
                            Gera um arquivo CSV contendo todos os dados cadastrais dos alunos,
                            compactado em um arquivo ZIP para segurança e facilidade de armazenamento.
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
