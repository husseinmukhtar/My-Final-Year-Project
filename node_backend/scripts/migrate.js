require('dotenv').config();
const db = require('../config/db');

async function runMigration() {
    try {
        console.log('Running migration...');
        await db.query('ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NOT NULL');
        console.log('Migration complete: password column updated to VARCHAR(255)');
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await db.end();
    }
}

runMigration();
