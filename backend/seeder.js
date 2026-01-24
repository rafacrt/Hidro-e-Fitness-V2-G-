const fs = require('fs');
const path = require('path');

const seedDatabase = async (pool) => {
    if (!pool) return;

    try {
        // Check if Modalities table is empty
        const check = await pool.query('SELECT COUNT(*) FROM modalities');
        const count = parseInt(check.rows[0].count);

        if (count > 0) {
            console.log("Seed skipped: Modalities table is not empty.");
            return;
        }

        console.log("Seeding database (initial deployment detected)...");
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. MODALITIES
            const modalPath = path.join(__dirname, 'seed_data/modalidades.csv');
            if (fs.existsSync(modalPath)) {
                console.log("Seeding Modalities...");
                const lines = fs.readFileSync(modalPath, 'utf-8').split('\n').slice(1).filter(l => l.trim());
                for (const line of lines) {
                    const regex = /;(?=(?:(?:[^"]*"){2})*[^"]*$)/;
                    const cols = line.split(regex).map(v => v.trim().replace(/^"|"$/g, ''));
                    if (cols.length < 5) continue;
                    const [id, name, target, desc, color] = cols;

                    await client.query(`
                        INSERT INTO modalities (id, name, target_audience, description, color)
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (id) DO NOTHING
                    `, [id, name, target, desc, color]);
                }
                await client.query("SELECT setval('modalities_id_seq', (SELECT MAX(id) FROM modalities))");
            }

            // 2. PLANS
            const plansPath = path.join(__dirname, 'seed_data/planos.csv');
            if (fs.existsSync(plansPath)) {
                console.log("Seeding Plans...");
                const lines = fs.readFileSync(plansPath, 'utf-8').split('\n').slice(1).filter(l => l.trim());
                for (const line of lines) {
                    const regex = /;(?=(?:(?:[^"]*"){2})*[^"]*$)/;
                    const cols = line.split(regex).map(v => v.trim().replace(/^"|"$/g, ''));
                    if (cols.length < 7) continue;
                    const [id, name, modId, freq, price, duration, classes] = cols;

                    await client.query(`
                        INSERT INTO plans (id, name, modality_id, frequency, price, duration_months, classes_per_week)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)
                        ON CONFLICT (id) DO NOTHING
                    `, [id, name, modId, freq, price, duration, classes]);
                }
                await client.query("SELECT setval('plans_id_seq', (SELECT MAX(id) FROM plans))");
            }

            // 3. STUDENTS
            const studentsPath = path.join(__dirname, 'seed_data/alunos.csv');
            if (fs.existsSync(studentsPath)) {
                console.log("Seeding Students...");
                const lines = fs.readFileSync(studentsPath, 'utf-8').split('\n').slice(1).filter(l => l.trim());
                let inserted = 0;
                let skipped = 0;
                for (const line of lines) {
                    try {
                        const regex = /;(?=(?:(?:[^"]*"){2})*[^"]*$)/;
                        const values = line.split(regex).map(val => val.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
                        if (values.length < 5) {
                            skipped++;
                            continue;
                        }

                        // Date Parsing Strategy
                        let birthDate = null;
                        if (values[5]) {
                            // Try ISO (YYYY-MM-DD or ISO string)
                            if (values[5].includes('T')) birthDate = values[5].split('T')[0];
                            else if (values[5].match(/^\d{4}-\d{2}-\d{2}$/)) birthDate = values[5];
                            // Try PT-BR (DD/MM/YYYY)
                            else if (values[5].match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                                const [d, m, y] = values[5].split('/');
                                birthDate = `${y}-${m}-${d}`;
                            }
                        }

                        const student = {
                            id: values[0],
                            name: values[1],
                            email: values[2],
                            cpf: values[3],
                            rg: values[4],
                            birth_date: birthDate,
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

                        // Validate Status Enums to match Schema Check
                        const validStatus = ['Ativo', 'Inativo', 'Trancado'];
                        if (!validStatus.includes(student.status)) student.status = 'Ativo';

                        await client.query(`
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
                                status = EXCLUDED.status,
                                plan_name = EXCLUDED.plan_name
                        `, [
                            parseInt(student.id), student.name, student.email || null, student.cpf || null, student.rg || null, student.birth_date, student.phone || null, student.is_whatsapp,
                            student.plan_name || null, student.modality_name || null, student.status,
                            student.addr_cep || null, student.addr_street || null, student.addr_number || null, student.addr_neighborhood || null, student.addr_city || null, student.addr_state || null, student.addr_complement || null,
                            student.guardian_name || null, student.guardian_cpf || null, student.guardian_phone || null, student.guardian_relationship || null, student.medical_notes || null
                        ]);
                        inserted++;
                    } catch (rowErr) {
                        console.error(`Failed to seed student (Line in CSV):`, rowErr.message);
                        skipped++;
                    }
                }

                // Update sequence
                await client.query("SELECT setval('students_id_seq', (SELECT MAX(id) FROM students))");
                console.log(`Students seeded: ${inserted} (Skipped/Errors: ${skipped})`);
            }

            await client.query('COMMIT');
            console.log("Seeding completed successfully.");
        } catch (e) {
            await client.query('ROLLBACK');
            console.error("Seeding failed:", e);
        } finally {
            client.release();
        }

    } catch (e) {
        console.error("Seeding check failed:", e);
    }
};

module.exports = { seedDatabase };
