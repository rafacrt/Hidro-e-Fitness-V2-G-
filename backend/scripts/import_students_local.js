const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Adjust path to point to root alunos.csv
const csvFilePath = path.join(__dirname, '../../alunos.csv');

// Local DB connection
const pool = new Pool({
    connectionString: 'postgresql://postgres:password@localhost:5432/hidro_fitness'
});

async function importStudents() {
    console.log('Iniciando importação de:', csvFilePath);

    try {
        const fileContent = fs.readFileSync(csvFilePath, 'utf-8');
        const lines = fileContent.split('\n').filter(l => l.trim() !== '');

        // Header: ID;Nome;Email...
        // We skip header
        const dataLines = lines.slice(1);

        console.log(`Encontrados ${dataLines.length} registros.`);

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            let inserted = 0;
            let errors = 0;

            for (const line of dataLines) {
                // Split by semicolon, handling simple quotes removal if needed
                // Simple split might fail if fields contain semicolons. 
                // Given the file view, fields are quoted if they contain delimiters? 
                // The file seems to use semicolons and quotes for strings.
                // Let's use a regex split similar to csvHelper

                // Regex to split by ; ignoring ; inside quotes
                const regex = /;(?=(?:(?:[^"]*"){2})*[^"]*$)/;
                const values = line.split(regex).map(val => val.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

                if (values.length < 5) {
                    console.warn('Linha inválida (poucas colunas):', line);
                    continue;
                }

                // Map columns based on file structure:
                // 0: ID, 1: Nome, 2: Email, 3: CPF, 4: RG, 5: Data Nascimento
                // 6: Telefone, 7: Whatsapp, 8: Plano, 9: Modalidades, 10: Status
                // 11: CEP, 12: Rua, 13: Número, 14: Bairro, 15: Cidade, 16: Estado
                // 17: Complemento, 18: Resp Nome, 19: Resp CPF, 20: Resp Tel, 21: Relacionamento
                // 22: Notas Médicas

                const student = {
                    id: values[0],
                    name: values[1],
                    email: values[2],
                    cpf: values[3],
                    rg: values[4],
                    birth_date: values[5] ? values[5].split('T')[0] : null, // Extract YYYY-MM-DD
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

                // ID handling: Try to use existing ID.
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
                        plan_name = EXCLUDED.plan_name
                    RETURNING id;
                `;

                const valuesArr = [
                    parseInt(student.id), student.name, student.email || null, student.cpf || null, student.rg || null, student.birth_date, student.phone || null, student.is_whatsapp,
                    student.plan_name || null, student.modality_name || null, student.status,
                    student.addr_cep || null, student.addr_street || null, student.addr_number || null, student.addr_neighborhood || null, student.addr_city || null, student.addr_state || null, student.addr_complement || null,
                    student.guardian_name || null, student.guardian_cpf || null, student.guardian_phone || null, student.guardian_relationship || null, student.medical_notes || null
                ];

                try {
                    await client.query(query, valuesArr);
                    inserted++;
                } catch (err) {
                    console.error(`Erro ao inserir ID ${student.id} (${student.name}):`, err.message);
                    errors++;
                }
            }

            // Update sequence
            await client.query("SELECT setval('students_id_seq', (SELECT MAX(id) FROM students));");

            await client.query('COMMIT');
            console.log(`Importação finalizada. Sucesso: ${inserted}, Erros: ${errors}`);

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('Erro fatal:', err);
    } finally {
        await pool.end();
    }
}

importStudents();
