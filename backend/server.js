const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001;

// Logging Helper
const logDir = path.join(__dirname, 'log');
if (!fs.existsSync(logDir)) {
    try {
        fs.mkdirSync(logDir);
    } catch (e) {
        console.error('Could not create log directory:', e);
    }
}
const logFile = path.join(logDir, 'backend.log');

const logToFile = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    try {
        fs.appendFileSync(logFile, logMessage);
    } catch (e) {
        console.error('Failed to write to log file:', e);
    }
};

// Global Error Handlers
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    logToFile(`Uncaught Exception: ${err.message}\n${err.stack}`);
    // Optional: process.exit(1); // Keep alive if possible for debugging, or let Docker restart
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    logToFile(`Unhandled Rejection: ${reason}`);
});

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
// Database Connection
let pool;

const ensureDatabaseExists = async () => {
    try {
        if (!process.env.DATABASE_URL) return;

        // Parse the connection string to switch to 'postgres' database
        const dbUrl = new URL(process.env.DATABASE_URL);
        const targetDbName = dbUrl.pathname.slice(1); // remove leading '/'

        if (!targetDbName || targetDbName === 'postgres') return;

        console.log(`Checking existence of database: ${targetDbName}`);
        logToFile(`Checking existence of database: ${targetDbName}`);

        // Connect to default 'postgres' database
        dbUrl.pathname = '/postgres';
        const adminConnectionString = dbUrl.toString();

        const adminPool = new Pool({ connectionString: adminConnectionString });

        try {
            const checkRes = await adminPool.query("SELECT 1 FROM pg_database WHERE datname = $1", [targetDbName]);
            if (checkRes.rowCount === 0) {
                console.log(`Database ${targetDbName} not found. Creating...`);
                logToFile(`Database ${targetDbName} not found. Creating...`);
                await adminPool.query(`CREATE DATABASE "${targetDbName}"`);
                console.log(`Database ${targetDbName} created successfully.`);
                logToFile(`Database ${targetDbName} created successfully.`);
            } else {
                console.log(`Database ${targetDbName} already exists.`);
            }
        } catch (err) {
            console.error("Error checking/creating database:", err.message);
            logToFile(`Error checking/creating database: ${err.message}`);
        } finally {
            await adminPool.end();
        }
    } catch (err) {
        console.error("Failed to parse DATABASE_URL or ensure DB:", err.message);
        logToFile(`Failed to parse DATABASE_URL or ensure DB: ${err.message}`);
    }
};

const initializePool = () => {
    try {
        if (!process.env.DATABASE_URL) {
            const msg = "DATABASE_URL environment variable is not defined";
            console.error(msg);
            logToFile(msg);
        } else {
            console.log("Initializing Pool with DATABASE_URL...");
            pool = new Pool({
                connectionString: process.env.DATABASE_URL,
            });

            pool.on('error', (err, client) => {
                console.error('Unexpected error on idle client', err);
                logToFile(`Unexpected error on idle client: ${err.message}`);
            });
        }
    } catch (err) {
        console.error("Failed to initialize database pool:", err);
        logToFile(`Failed to initialize database pool: ${err.message}`);
    }
};

const ensureSchemaExists = async () => {
    if (!pool) return;

    try {
        // Check if 'users' table exists as a proxy for schema existence
        const checkTable = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);

        if (!checkTable.rows[0].exists) {
            console.log("Schema appears missing. attempting to run init.sql...");
            logToFile("Schema appears missing. attempting to run init.sql...");

            const initSqlPath = path.join(__dirname, 'init.sql');
            if (fs.existsSync(initSqlPath)) {
                const sql = fs.readFileSync(initSqlPath, 'utf8');
                await pool.query(sql);
                console.log("Schema initialized successfully from init.sql");
                logToFile("Schema initialized successfully from init.sql");
            } else {
                console.error("init.sql not found at:", initSqlPath);
                logToFile(`init.sql not found at: ${initSqlPath}`);
            }
        } else {
            console.log("Schema checks passed (users table exists).");
            logToFile("Schema checks passed (users table exists).");
        }
    } catch (err) {
        console.error("Failed to ensure schema:", err);
        logToFile(`Failed to ensure schema: ${err.message}`);
    }
};

// Test DB Connection with Retry
const connectWithRetry = async () => {
    await ensureDatabaseExists();
    initializePool();

    if (!pool) {
        console.error("Pool is not initialized, skipping connection retry.");
        logToFile("Pool is not initialized, skipping connection retry.");
        return;
    }

    // Ensure schema exists (create tables if needed)
    await ensureSchemaExists();

    // Run migrations/updates
    try {
        await pool.query(`
            DO $$
            BEGIN
                -- Drop old constraint if exists
                IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'plans_frequency_check') THEN
                    ALTER TABLE plans DROP CONSTRAINT plans_frequency_check;
                END IF;
                -- Add new constraint with Semanal
                ALTER TABLE plans ADD CONSTRAINT plans_frequency_check 
                CHECK (frequency IN ('Semanal', 'Mensal', 'Bimestral', 'Trimestral', 'Semestral', 'Anual'));
            END $$;
        `);
        console.log("Schema constraints updated.");
    } catch (err) {
        console.error("Schema update failed:", err.message);
    }

    let retries = 5;
    while (retries > 0) {
        try {
            const client = await pool.connect();
            const result = await client.query('SELECT NOW()');
            client.release();
            console.log('Connected to Database:', result.rows[0]);
            logToFile('Connected to Database successfully.');
            return;
        } catch (err) {
            console.error(`Error connecting to database (retries left: ${retries}):`, err.message);
            logToFile(`Error connecting to database: ${err.message}`);
            retries -= 1;
            await new Promise(res => setTimeout(res, 5000)); // Wait 5 seconds
        }
    }
    console.error('Could not connect to database after multiple retries.');
    logToFile('Could not connect to database after multiple retries.');
    // We don't exit process here to allow the server to keep running and potentially connect later
};

connectWithRetry();

// --- HELPERS ---
const toNull = (value) => {
    if (value === '' || value === undefined || value === 'undefined' || value === null || value === '\\N' || value === 'NULL') {
        return null;
    }
    return value;
};

// --- ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// Dashboard KPIs
app.get('/api/dashboard/kpis', async (req, res) => {
    try {
        const activeStudentsResult = await pool.query("SELECT COUNT(*) FROM students WHERE status = 'Ativo'");
        const activeStudents = parseInt(activeStudentsResult.rows[0].count);

        const occupationResult = await pool.query("SELECT SUM(capacity) as total_cap, SUM(enrolled) as total_enrolled FROM classes WHERE status != 'Cancelled'");
        const totalCap = parseInt(occupationResult.rows[0].total_cap) || 0;
        const totalEnrolled = parseInt(occupationResult.rows[0].total_enrolled) || 0;
        const occupationRate = totalCap > 0 ? Math.round((totalEnrolled / totalCap) * 100) : 0;

        const revenueResult = await pool.query("SELECT SUM(amount) FROM transactions WHERE type = 'INCOME' AND status = 'PAID' AND date_part('month', date) = date_part('month', CURRENT_DATE)");
        const revenue = parseFloat(revenueResult.rows[0].sum) || 0;

        const daysMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
        const today = daysMap[new Date().getDay()];

        const classesTodayResult = await pool.query("SELECT COUNT(*) FROM classes WHERE $1 = ANY(days) AND status != 'Cancelled'", [today]);
        const classesToday = parseInt(classesTodayResult.rows[0].count);

        res.json([
            { label: 'Total Alunos Ativos', value: activeStudents, trend: 0, icon: 'Users', color: 'text-blue-600' },
            { label: 'Ocupação Média', value: `${occupationRate}%`, trend: 0, icon: 'Activity', color: 'text-teal-600' },
            { label: 'Receita Mensal', value: `R$ ${revenue.toLocaleString('pt-BR')}`, trend: 0, icon: 'CreditCard', color: 'text-green-600' },
            { label: 'Aulas Hoje', value: classesToday, trend: 0, icon: 'Calendar', color: 'text-purple-600' },
        ]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Dashboard Charts
app.get('/api/dashboard/charts', async (req, res) => {
    try {
        // Occupation (Students per Modality)
        const occupationResult = await pool.query(`
            SELECT modality_name as name, COUNT(*)::int as value 
            FROM students 
            WHERE modality_name IS NOT NULL 
            GROUP BY modality_name
        `);

        // Status (Students per Status)
        const statusResult = await pool.query(`
            SELECT status as name, COUNT(*)::int as value 
            FROM students 
            GROUP BY status
        `);

        // Frequency (Placeholder - we don't have attendance data yet)
        // We could use enrollments per month here if desired
        const frequency = [
            { name: 'Jan', value: 0 },
            { name: 'Fev', value: 0 },
            { name: 'Mar', value: 0 },
            { name: 'Abr', value: 0 },
            { name: 'Mai', value: 0 },
            { name: 'Jun', value: 0 },
        ];

        res.json({
            frequency: frequency,
            occupation: occupationResult.rows,
            status: statusResult.rows
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        console.log('Login attempt:', { email }); // DEBUG
        const result = await pool.query('SELECT * FROM users WHERE email = $1 AND password = $2', [email, password]);
        console.log('Login result count:', result.rows.length); // DEBUG
        if (result.rows.length > 0) {
            const user = result.rows[0];
            const { password, ...safeUser } = user;
            res.json(safeUser);
        } else {
            console.log('Login failed: Invalid credentials'); // DEBUG
            res.status(401).json({ error: 'Credenciais inválidas' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Students
app.get('/api/students', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id, name, email, cpf, rg, birth_date as "birthDate", phone, is_whatsapp as "isWhatsapp",
                addr_cep as "cep", addr_street as "street", addr_number as "number", 
                addr_neighborhood as "neighborhood", addr_city as "city", addr_state as "state",
                status, plan_name as "plan", modality_name as "modality", 
                enrollment_date as "enrollmentDate", payment_status as "paymentStatus",
                guardian_name, guardian_cpf, guardian_phone, guardian_relationship
            FROM students ORDER BY name
        `);

        // Transform address structure to match frontend expectation if needed
        const students = result.rows.map(s => ({
            ...s,
            address: {
                cep: s.cep,
                street: s.street,
                number: s.number,
                neighborhood: s.neighborhood,
                city: s.city,
                state: s.state
            }
        }));

        res.json(students);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



// Students - POST
app.post('/api/students', async (req, res) => {
    const {
        name, email, cpf, birthDate, phone, isWhatsapp,
        address, guardian, plan, modality, status, medicalNotes
    } = req.body;

    // Validação básica
    if (!name) {
        return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    try {
        const result = await pool.query(`
            INSERT INTO students (
                name, email, cpf, birth_date, phone, is_whatsapp,
                addr_cep, addr_street, addr_number, addr_neighborhood, addr_city, addr_state,
                guardian_name, guardian_cpf, guardian_phone, guardian_relationship,
                plan_name, modality_name, status, medical_notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
            RETURNING id
        `, [
            name,
            toNull(email),
            toNull(cpf),
            toNull(birthDate),
            toNull(phone),
            isWhatsapp || false,
            toNull(address?.cep),
            toNull(address?.street),
            toNull(address?.number),
            toNull(address?.neighborhood),
            toNull(address?.city),
            toNull(address?.state),
            toNull(guardian?.name),
            toNull(guardian?.cpf),
            toNull(guardian?.phone),
            toNull(guardian?.relationship),
            toNull(plan),
            toNull(modality),
            status || 'Ativo',
            toNull(medicalNotes)
        ]);
        res.status(201).json({ id: result.rows[0].id, message: 'Student created' });
    } catch (err) {
        console.error('Erro ao criar aluno:', err.message, err.stack);
        res.status(500).json({ error: 'Internal Server Error', details: err.message });
    }
});

// Students - PUT
app.put('/api/students/:id', async (req, res) => {
    const { id } = req.params;
    const {
        name, email, cpf, birthDate, phone, isWhatsapp,
        address, guardian, plan, modality, status, medicalNotes
    } = req.body;

    try {
        await pool.query(`
            UPDATE students SET
                name = $1, email = $2, cpf = $3, birth_date = $4, phone = $5, is_whatsapp = $6,
                addr_cep = $7, addr_street = $8, addr_number = $9, addr_neighborhood = $10, addr_city = $11, addr_state = $12,
                guardian_name = $13, guardian_cpf = $14, guardian_phone = $15, guardian_relationship = $16,
                plan_name = $17, modality_name = $18, status = $19, medical_notes = $20
            WHERE id = $21
        `, [
            name,
            toNull(email),
            toNull(cpf),
            toNull(birthDate),
            toNull(phone),
            isWhatsapp,
            toNull(address?.cep),
            toNull(address?.street),
            toNull(address?.number),
            toNull(address?.neighborhood),
            toNull(address?.city),
            toNull(address?.state),
            toNull(guardian?.name),
            toNull(guardian?.cpf),
            toNull(guardian?.phone),
            toNull(guardian?.relationship),
            toNull(plan),
            toNull(modality),
            status,
            toNull(medicalNotes),
            id
        ]);
        res.json({ message: 'Student updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Students - DELETE
app.delete('/api/students/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM students WHERE id = $1', [id]);
        res.json({ message: 'Student deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Modalities
app.get('/api/modalities', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, target_audience as "targetAudience", description, color FROM modalities');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Plans
app.get('/api/plans', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, modality_id as "modalityId", frequency, price, duration_months as "durationMonths", classes_per_week as "classesPerWeek" FROM plans');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Classes
app.get('/api/classes', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id, name, time_start as "time", time_end as "endTime", days, 
                instructor, capacity, enrolled, modality_id as "modalityId", status
            FROM classes ORDER BY time_start
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Modalities - POST
app.post('/api/modalities', async (req, res) => {
    const { name, targetAudience, description, color } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO modalities (name, target_audience, description, color) VALUES ($1, $2, $3, $4) RETURNING id',
            [name, targetAudience, description, color]
        );
        res.status(201).json({ id: result.rows[0].id, message: 'Modality created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Plans - POST
app.post('/api/plans', async (req, res) => {
    const { name, modalityId, frequency, price, durationMonths, classesPerWeek } = req.body;
    console.log('Creating Plan:', { name, modalityId, frequency, price });
    try {
        const result = await pool.query(
            'INSERT INTO plans (name, modality_id, frequency, price, duration_months, classes_per_week) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [name, toNull(modalityId), frequency, price, durationMonths, classesPerWeek]
        );
        res.status(201).json({ id: result.rows[0].id, message: 'Plan created' });
    } catch (err) {
        console.error('Error creating plan:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Plans - PUT
app.put('/api/plans/:id', async (req, res) => {
    const { id } = req.params;
    const { name, modalityId, frequency, price, durationMonths, classesPerWeek } = req.body;
    try {
        await pool.query(
            'UPDATE plans SET name = $1, modality_id = $2, frequency = $3, price = $4, duration_months = $5, classes_per_week = $6 WHERE id = $7',
            [name, toNull(modalityId), frequency, price, durationMonths, classesPerWeek, id]
        );
        res.json({ message: 'Plan updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Plans - DELETE
app.delete('/api/plans/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM plans WHERE id = $1', [id]);
        res.json({ message: 'Plan deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Modalities - PUT
app.put('/api/modalities/:id', async (req, res) => {
    const { id } = req.params;
    const { name, targetAudience, description, color } = req.body;
    try {
        await pool.query(
            'UPDATE modalities SET name = $1, target_audience = $2, description = $3, color = $4 WHERE id = $5',
            [name, targetAudience, description, color, id]
        );
        res.json({ message: 'Modality updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Modalities - DELETE
app.delete('/api/modalities/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Check for dependencies (plans, classes, students) before deleting?
        // For now, let's assume cascade or simple delete, but usually we should check.
        // Postgres will throw error if foreign key constraint fails, which is good.
        await pool.query('DELETE FROM modalities WHERE id = $1', [id]);
        res.json({ message: 'Modality deleted' });
    } catch (err) {
        console.error(err);
        if (err.code === '23503') { // Foreign key violation
            res.status(400).json({ error: 'Não é possível excluir esta modalidade pois existem planos, turmas ou alunos vinculados a ela.' });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});

// Classes - POST
app.post('/api/classes', async (req, res) => {
    const { name, time, days, instructor, capacity, modalityId } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO classes (name, time_start, days, instructor, capacity, modality_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
            [name, time, days, instructor, toNull(capacity), toNull(modalityId)]
        );
        res.status(201).json({ id: result.rows[0].id, message: 'Class created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Finance - GET
app.get('/api/finance', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                id, description, type, category, amount, date, 
                due_date as "dueDate", status, related_entity as "relatedEntity"
            FROM transactions ORDER BY date DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Finance - POST
app.post('/api/finance', async (req, res) => {
    const { id, description, type, category, amount, date, dueDate, status, relatedEntity } = req.body;
    try {
        await pool.query(
            `INSERT INTO transactions (id, description, type, category, amount, date, due_date, status, related_entity)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [id, description, type, category, amount, date, dueDate, status, relatedEntity]
        );
        res.status(201).json({ message: 'Transaction created' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Finance - PUT
app.put('/api/finance/:id', async (req, res) => {
    const { id } = req.params;
    const { description, type, category, amount, date, dueDate, status, relatedEntity } = req.body;
    try {
        await pool.query(
            `UPDATE transactions 
             SET description = $1, type = $2, category = $3, amount = $4, date = $5, due_date = $6, status = $7, related_entity = $8
             WHERE id = $9`,
            [description, type, category, amount, date, dueDate, status, relatedEntity, id]
        );
        res.json({ message: 'Transaction updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Finance - DELETE
app.delete('/api/finance/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM transactions WHERE id = $1', [id]);
        res.json({ message: 'Transaction deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Users - GET
app.get('/api/users', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, role, avatar FROM users ORDER BY name');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Users - POST
app.post('/api/users', async (req, res) => {
    const { name, email, password, role, avatar } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO users (name, email, password, role, avatar) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, avatar',
            [name, email, password, role, avatar]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Users - PUT
app.put('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, password, role } = req.body;

    try {
        if (password) {
            await pool.query(
                'UPDATE users SET name = $1, email = $2, password = $3, role = $4 WHERE id = $5',
                [name, email, password, role, id]
            );
        } else {
            await pool.query(
                'UPDATE users SET name = $1, email = $2, role = $3 WHERE id = $4',
                [name, email, role, id]
            );
        }
        res.json({ message: 'User updated' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Users - DELETE
app.delete('/api/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: 'User deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Remove constraint if exists to allow flexible frequency names
if (pool) {
    pool.query("ALTER TABLE plans DROP CONSTRAINT IF EXISTS plans_frequency_check")
        .then(() => {
            console.log("Constraint plans_frequency_check removed (if existed)");
            logToFile("Constraint plans_frequency_check removed (if existed)");
        })
        .catch(err => {
            console.error("Error removing constraint:", err);
            logToFile(`Error removing constraint: ${err.message}`);
        });
} else {
    console.warn("Pool not initialized, skipping constraint removal.");
    logToFile("Pool not initialized, skipping constraint removal.");
}

app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
    logToFile(`Backend running on port ${port}`);
});
