const pool = require('./config/db');

async function run() {
    try {
        await pool.query("ALTER TABLE donations ADD COLUMN currency VARCHAR(10) DEFAULT 'USD' AFTER amount");
        console.log('success');
    } catch(e) {
        if (e.code === 'ER_DUP_FIELDNAME') {
            console.log('Column already exists');
        } else {
            console.error(e.message);
        }
    } finally {
        process.exit();
    }
}
run();
