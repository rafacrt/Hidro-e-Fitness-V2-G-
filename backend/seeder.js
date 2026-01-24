const fs = require('fs');
const path = require('path');

const seedDatabase = async (pool) => {
    if (!pool) return;

    try {
        console.log("Seeding database check...");
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. MODALITIES
            const checkMod = await client.query('SELECT COUNT(*) FROM modalities');
            if (parseInt(checkMod.rows[0].count) === 0) {
                console.log("Seeding database (initial deployment detected for Modalities)...");
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
            } else {
                console.log("Modalities already exist, skipping.");
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
            console.log(`[SEEDER] Checking for students file at: ${studentsPath}`);

            if (fs.existsSync(studentsPath)) {
                console.log("[SEEDER] File found. Reading content...");
                const fileContent = fs.readFileSync(studentsPath, 'utf-8');
                console.log(`[SEEDER] File content length: ${fileContent.length} bytes`);
                const lines = fileContent.split('\n').filter(l => l.trim().length > 0);
                console.log(`[SEEDER] Total lines found: ${lines.length}`);

                // Log header and first row for debugging
                if (lines.length > 0) console.log(`[SEEDER] Header: ${lines[0]}`);
                if (lines.length > 1) console.log(`[SEEDER] First Row: ${lines[1]}`);

                const dataLines = lines.slice(1); // Skip header
                let inserted = 0;
                let skipped = 0;

                for (let i = 0; i < dataLines.length; i++) {
                    const line = dataLines[i];
                    try {
                        // Regex to split by semicolon, respecting quotes
                        const regex = /;(?=(?:(?:[^"]*"){2})*[^"]*$)/;
                        const values = line.split(regex).map(val => val.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

                        if (values.length < 5) {
                            console.warn(`[SEEDER] Skipping line ${i + 2}: Insufficient columns (${values.length})`);
                            skipped++;
                            continue;
                        }

                        // Date Parsing Strategy
                        let birthDate = null;
                        if (values[5] && values[5] !== 'null') {
                            const rawDate = values[5];
                            // Try ISO (YYYY-MM-DD or ISO string)
                            if (rawDate.includes('T')) birthDate = rawDate.split('T')[0];
                            else if (rawDate.match(/^\d{4}-\d{2}-\d{2}$/)) birthDate = rawDate;
                            // Try PT-BR (DD/MM/YYYY)
                            else if (rawDate.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                                const [d, m, y] = rawDate.split('/');
                                birthDate = `${y}-${m}-${d}`;
                            }
                        }

                        // Sanitize empty strings to null for optional fields
                        const sanitize = (val) => (!val || val === '' || val === 'null' ? null : val);

                        const student = {
                            id: parseInt(values[0]),
                            name: values[1],
                            email: sanitize(values[2]),
                            cpf: sanitize(values[3]),
                            rg: sanitize(values[4]),
                            birth_date: birthDate,
                            phone: sanitize(values[6]),
                            is_whatsapp: values[7]?.toLowerCase() === 'sim' || values[7]?.toLowerCase() === 'true',
                            plan_name: values[8] === 'Não' || values[8] === 'null' ? null : values[8],
                            modality_name: sanitize(values[9]),
                            status: values[10] || 'Ativo',
                            addr_cep: sanitize(values[11]),
                            addr_street: sanitize(values[12]),
                            addr_number: sanitize(values[13]),
                            addr_neighborhood: sanitize(values[14]),
                            addr_city: sanitize(values[15]),
                            addr_state: sanitize(values[16]),
                            addr_complement: sanitize(values[17]),
                            guardian_name: sanitize(values[18]),
                            guardian_cpf: sanitize(values[19]),
                            guardian_phone: sanitize(values[20]),
                            guardian_relationship: sanitize(values[21]),
                            medical_notes: sanitize(values[22])
                        };

                        // Enforce numeric ID
                        if (isNaN(student.id)) {
                            console.warn(`[SEEDER] Skipping line ${i + 2}: Invalid ID (${values[0]})`);
                            skipped++;
                            continue;
                        }

                        // Validate Status Enums
                        const validStatus = ['Ativo', 'Inativo', 'Trancado'];
                        if (!validStatus.includes(student.status)) {
                            // Try to fuzzy match or default
                            student.status = 'Ativo';
                        }

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
                                plan_name = EXCLUDED.plan_name,
                                modality_name = EXCLUDED.modality_name
                        `, [
                            student.id, student.name, student.email, student.cpf, student.rg, student.birth_date, student.phone, student.is_whatsapp,
                            student.plan_name, student.modality_name, student.status,
                            student.addr_cep, student.addr_street, student.addr_number, student.addr_neighborhood, student.addr_city, student.addr_state, student.addr_complement,
                            student.guardian_name, student.guardian_cpf, student.guardian_phone, student.guardian_relationship, student.medical_notes
                        ]);
                        inserted++;
                    } catch (rowErr) {
                        console.error(`[SEEDER] ERROR on line ${i + 2}: ${rowErr.message}`);
                        console.error(`[SEEDER] Validating Row Data: ${line}`);
                        skipped++;
                    }
                }

                await client.query("SELECT setval('students_id_seq', (SELECT MAX(id) FROM students))");
                console.log(`[SEEDER] Student seeding finished. Inserted: ${inserted}, Skipped/Failed: ${skipped}`);
            } else {
                console.error(`[SEEDER] Students file NOT FOUND at ${studentsPath}`);
                // List directory to help debug
                try {
                    const dir = path.dirname(studentsPath);
                    console.log(`[SEEDER] Directory contents of ${dir}:`, fs.readdirSync(dir));
                } catch (e) { console.log("Could not list dir"); }
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
