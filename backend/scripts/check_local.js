const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:password@localhost:5433/hidro_fitness' // Local DB
});

async function checkLocalData() {
    try {
        console.log("Checking Local Database...");
        const res = await pool.query("SELECT COUNT(*) as total, COUNT(plan_name) as with_plan FROM students WHERE plan_name IS NOT NULL AND plan_name != 'Não'");
        console.log("Local Students:", res.rows[0]);

        const finRes = await pool.query("SELECT COUNT(*) as transactions FROM transactions");
        console.log("Local Transactions:", finRes.rows[0]);

        pool.end();
    } catch (err) {
        console.error("Error connecting to local:", err.message);
    }
}

checkLocalData();
