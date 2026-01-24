const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// CONFIGURAÇÃO DO BANCO DE DADOS DE PRODUÇÃO
// Adicionamos ?ssl=true para garantir
const connectionString = 'postgresql://postgress:8X892LtEO1ljgYK2@hidro-hidro-jhrojv:5432/hidro_fitness';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Importante para conexão externa
});

async function importData() {
    const client = await pool.connect();
    console.log("Conectado ao banco de produção!");

    try {
        await client.query('BEGIN');

        // ==========================================
        // 1. IMPORTAR MODALIDADES
        // ==========================================
        const modalPath = path.join(__dirname, '../../modalidades.csv');
        if (fs.existsSync(modalPath)) {
            console.log("Importando Modalidades...");
            const modalContent = fs.readFileSync(modalPath, 'utf-8');
            const lines = modalContent.split('\n').slice(1).filter(l => l.trim());

            for (const line of lines) {
                // Parse CSV line (basic semicolon split, careful with quotes)
                const regex = /;(?=(?:(?:[^"]*"){2})*[^"]*$)/;
                const cols = line.split(regex).map(v => v.trim().replace(/^"|"$/g, ''));

                if (cols.length < 5) continue;

                const [id, name, target, desc, color] = cols;

                await client.query(`
                    INSERT INTO modalities (id, name, target_audience, description, color)
                    VALUES ($1, $2, $3, $4, $5)
                    ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    target_audience = EXCLUDED.target_audience,
                    description = EXCLUDED.description,
                    color = EXCLUDED.color;
                `, [id, name, target, desc, color]);
            }
            // Ajustar sequência
            await client.query("SELECT setval('modalities_id_seq', (SELECT MAX(id) FROM modalities))");
            console.log("Modalidades importadas!");
        }

        // ==========================================
        // 2. IMPORTAR PLANOS
        // ==========================================
        const plansPath = path.join(__dirname, '../../planos.csv');
        if (fs.existsSync(plansPath)) {
            console.log("Importando Planos...");
            const planContent = fs.readFileSync(plansPath, 'utf-8');
            const lines = planContent.split('\n').slice(1).filter(l => l.trim());

            for (const line of lines) {
                const regex = /;(?=(?:(?:[^"]*"){2})*[^"]*$)/;
                const cols = line.split(regex).map(v => v.trim().replace(/^"|"$/g, ''));

                if (cols.length < 7) continue;

                // ID;Nome;Modalidade ID;Frequência;Preço;Duração (Meses);Aulas/Semana
                const [id, name, modId, freq, price, duration, classes] = cols;

                await client.query(`
                    INSERT INTO plans (id, name, modality_id, frequency, price, duration_months, classes_per_week)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    modality_id = EXCLUDED.modality_id,
                    frequency = EXCLUDED.frequency,
                    price = EXCLUDED.price,
                    duration_months = EXCLUDED.duration_months,
                    classes_per_week = EXCLUDED.classes_per_week;
                `, [id, name, modId, freq, price, duration, classes]);
            }
            // Ajustar sequência
            await client.query("SELECT setval('plans_id_seq', (SELECT MAX(id) FROM plans))");
            console.log("Planos importados!");
        }

        // ==========================================
        // 3. IMPORTAR ALUNOS (Cópia da lógica do script local)
        // ==========================================
        const studentsPath = path.join(__dirname, '../../alunos.csv');
        if (fs.existsSync(studentsPath)) {
            console.log("Importando Alunos do alunos.csv...");
            const fileContent = fs.readFileSync(studentsPath, 'utf-8');
            const lines = fileContent.split('\n').slice(1).filter(l => l.trim());

            let inserted = 0;
            for (const line of lines) {
                const regex = /;(?=(?:(?:[^"]*"){2})*[^"]*$)/;
                const values = line.split(regex).map(val => val.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

                if (values.length < 5) continue;

                // Mapeamento (ID;Nome;Email...)
                // 0: ID, 1: Nome, 2: Email, ... (ver import_students_local.js)
                // 8: Plano (Nome), 9: Modalidade (Nome) -> Precisamos lidar com isso se for texto.
                // Mas no alunos.csv que vi antes, parecia ter textos.

                const student = {
                    id: values[0],
                    name: values[1],
                    email: values[2],
                    cpf: values[3],
                    rg: values[4],
                    birth_date: values[5] ? values[5].split('T')[0] : null,
                    phone: values[6],
                    is_whatsapp: values[7]?.toLowerCase() === 'sim',
                    plan_name: values[8] === 'Não' ? null : values[8],
                    modality_name: values[9],
                    status: values[10] || 'Ativo',
                    addr_cep: values[11],
                    addr_street: values[12],
                    addr_number: values[13],
                    addr_neighborhood: values[14],
                    addr_city: values[15],
                    addr_state: values[16],
                    addr_complement: values[17],
                    guardian_name: values[18],
                    guardian_cpf: values[19],
                    guardian_phone: values[20],
                    guardian_relationship: values[21],
                    medical_notes: values[22]
                };

                const query = `
                    INSERT INTO students (
                        id, name, email, cpf, rg, birth_date, phone, is_whatsapp,
                        plan_name, modality_name, status,
                        addr_cep, addr_street, addr_number, addr_neighborhood, addr_city, addr_state, addr_complement,
                        guardian_name, guardian_cpf, guardian_phone, guardian_relationship, medical_notes
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6, $7, $8,
                        $9, $10, $11,
                        $12, $13, $14, $15, $16, $17, $18,
                        $19, $20, $21, $22, $23
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        email = EXCLUDED.email,
                        status = EXCLUDED.status,
                        plan_name = EXCLUDED.plan_name;
                `;

                const valuesArr = [
                    parseInt(student.id), student.name, student.email || null, student.cpf || null, student.rg || null, student.birth_date, student.phone || null, student.is_whatsapp,
                    student.plan_name || null, student.modality_name || null, student.status,
                    student.addr_cep || null, student.addr_street || null, student.addr_number || null, student.addr_neighborhood || null, student.addr_city || null, student.addr_state || null, student.addr_complement || null,
                    student.guardian_name || null, student.guardian_cpf || null, student.guardian_phone || null, student.guardian_relationship || null, student.medical_notes || null
                ];

                await client.query(query, valuesArr);
                inserted++;
            }
            await client.query("SELECT setval('students_id_seq', (SELECT MAX(id) FROM students))");
            console.log(`Alunos importados: ${inserted}`);
        }

        await client.query('COMMIT');
        console.log("=========================================");
        console.log("SEMENTE DE DADOS CONCLUÍDA COM SUCESSO!");
        console.log("=========================================");

    } catch (e) {
        await client.query('ROLLBACK');
        console.error("Erro na transação:", e);
    } finally {
        client.release();
        pool.end();
    }
}

importData();
