const pool = require('./config/db');

async function run() {
    try {
        console.log("Adding columns to donations...");
        
        // Use a single query for multiple alterations where possible, or sequential
        const queries = [
            "ALTER TABLE donations ADD COLUMN phone VARCHAR(20) DEFAULT NULL AFTER donor_email",
            "ALTER TABLE donations ADD COLUMN message TEXT DEFAULT NULL AFTER item_description",
            "ALTER TABLE donations ADD COLUMN reference VARCHAR(50) DEFAULT NULL AFTER message",
            "ALTER TABLE donations ADD COLUMN status ENUM('pending', 'successful', 'failed', 'awaiting_confirmation') DEFAULT 'pending' AFTER reference",
            "ALTER TABLE donations ADD COLUMN paid_at DATETIME DEFAULT NULL AFTER status",
            "ALTER TABLE donations ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER paid_at"
        ];

        for (let q of queries) {
            try {
                await pool.query(q);
                console.log("Success: ", q.split('ADD COLUMN ')[1].split(' ')[0]);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log("Column already exists: ", q.split('ADD COLUMN ')[1].split(' ')[0]);
                } else {
                    console.error("Error on query:", q, err.message);
                }
            }
        }
        console.log('Migration completed.');
    } catch(e) {
        console.error("Migration failed:", e.message);
    } finally {
        process.exit();
    }
}
run();
