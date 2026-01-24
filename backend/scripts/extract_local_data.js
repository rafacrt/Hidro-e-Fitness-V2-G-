const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Conexão com o banco LOCAL (onde os dados estão corretos)
// AVISO: Usando porta 5433 conforme configurado no docker-compose local
const localPool = new Pool({
    connectionString: 'postgresql://postgres:password@localhost:5433/hidro_fitness'
});

async function exportLocalData() {
    console.log("Iniciando exportação dos dados LOCAIS...");
    const client = await localPool.connect();

    try {
        // 1. Exportar ALUNOS (com planos corretos)
        console.log("Exportando Alunos...");
        const resStudents = await client.query('SELECT * FROM students ORDER BY id ASC');

        // Gerar CSV de Alunos
        const headers = [
            'ID', 'Nome', 'Email', 'CPF', 'RG', 'Data Nascimento', 'Telefone', 'Whatsapp',
            'Plano', 'Modalidades', 'Status', 'CEP', 'Rua', 'Número', 'Bairro', 'Cidade',
            'Estado', 'Complemento', 'Responsável Nome', 'Responsável CPF', 'Responsável Telefone',
            'Relacionamento', 'Notas Médicas'
        ];

        const csvRows = [headers.join(';')];

        for (const s of resStudents.rows) {
            const row = [
                s.id,
                quote(s.name),
                quote(s.email),
                quote(s.cpf),
                quote(s.rg),
                s.birth_date ? new Date(s.birth_date).toISOString() : '', // ISO format for safety
                quote(s.phone),
                s.is_whatsapp ? 'Sim' : 'Não',
                quote(s.plan_name || 'Não'), // Aqui pega o plano correto!
                quote(s.modality_name),
                s.status,
                quote(s.addr_cep),
                quote(s.addr_street),
                quote(s.addr_number),
                quote(s.addr_neighborhood),
                quote(s.addr_city),
                quote(s.addr_state),
                quote(s.addr_complement),
                quote(s.guardian_name),
                quote(s.guardian_cpf),
                quote(s.guardian_phone),
                quote(s.guardian_relationship),
                quote(s.medical_notes)
            ];
            csvRows.push(row.join(';'));
        }

        const studentsCsvPath = path.join(__dirname, '../seed_data/alunos.csv');
        fs.writeFileSync(studentsCsvPath, csvRows.join('\n'));
        console.log(`✅ Alunos exportados: ${resStudents.rowCount} registros -> ${studentsCsvPath}`);

        // 2. Exportar FINANCEIRO (transactions)
        console.log("Exportando Financeiro...");
        const resFinance = await client.query('SELECT * FROM transactions');

        // CSV de Financeiro (simples para importação)
        const finHeaders = ['id', 'description', 'type', 'category', 'amount', 'date', 'due_date', 'status', 'related_entity'];
        const finRows = [finHeaders.join(';')];

        for (const t of resFinance.rows) {
            const row = [
                t.id,
                quote(t.description),
                t.type,
                t.category,
                t.amount,
                t.date ? new Date(t.date).toISOString().split('T')[0] : '',
                t.due_date ? new Date(t.due_date).toISOString().split('T')[0] : '',
                t.status,
                quote(t.related_entity)
            ];
            finRows.push(row.join(';'));
        }

        const financeCsvPath = path.join(__dirname, '../seed_data/financeiro.csv');
        fs.writeFileSync(financeCsvPath, finRows.join('\n'));
        console.log(`✅ Financeiro exportado: ${resFinance.rowCount} registros -> ${financeCsvPath}`);

    } catch (err) {
        console.error("Erro na exportação:", err);
    } finally {
        client.release();
        localPool.end();
    }
}

function quote(str) {
    if (!str) return '';
    return `"${String(str).replace(/"/g, '""')}"`;
}

exportLocalData();
