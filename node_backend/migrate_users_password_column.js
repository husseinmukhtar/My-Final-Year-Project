/**
 * Safe one-time migration: widen users.password to VARCHAR(255).
 *
 * Run from node_backend/:
 *   node migrate_users_password_column.js
 *
 * What it does:
 *   1. Reads the current column length from information_schema.
 *   2. Skips the ALTER if the column is already >= 255.
 *   3. Widens to VARCHAR(255) if it is shorter.
 *   4. Prints the before/after lengths so you have an audit trail.
 *
 * After running this script you should also reset any passwords that
 * were inserted while the column was too short (they are stored
 * truncated and will never match). Use runDbUpdate.js for that.
 */
const pool = require('./config/db');

async function run() {
    const conn = await pool.getConnection();
    try {
        const [cols] = await conn.query(
            `SELECT CHARACTER_MAXIMUM_LENGTH
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'users'
               AND COLUMN_NAME  = 'password'`
        );

        if (!cols.length) {
            console.error('ERROR: users.password column not found. Verify DB_NAME in .env and that the table exists.');
            process.exit(1);
        }

        const currentLen = cols[0].CHARACTER_MAXIMUM_LENGTH;
        console.log(`Current  users.password  VARCHAR(${currentLen})`);

        if (currentLen >= 255) {
            console.log('Already VARCHAR(255) or wider — no change needed.');
        } else {
            await conn.query('ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NOT NULL');
            console.log(`Widened: VARCHAR(${currentLen}) → VARCHAR(255)`);
        }

        // Confirm
        const [after] = await conn.query(
            `SELECT CHARACTER_MAXIMUM_LENGTH
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME   = 'users'
               AND COLUMN_NAME  = 'password'`
        );
        console.log(`Verified: users.password is now VARCHAR(${after[0].CHARACTER_MAXIMUM_LENGTH})`);
        console.log('Done. Re-hash any passwords that were inserted before this fix using runDbUpdate.js.');
    } finally {
        conn.release();
        process.exit(0);
    }
}

run().catch(err => {
    console.error('Migration failed:', err.message);
    process.exit(1);
});
