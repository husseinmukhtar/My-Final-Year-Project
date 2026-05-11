const bcrypt = require('bcryptjs');
require('dotenv').config();
const db = require('../config/db');

async function seedUsers() {

    try {
        console.log('Running migration...');
        await db.query('ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NOT NULL');
        console.log('Migration complete: password column updated to VARCHAR(255)');

        const saltRounds = 10;
        const [adminRows] = await db.query(
            "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
        );

        if (adminRows.length > 0) {
            console.log('Admin account already exists. Skipping.');
        } else {
            const adminPasswordHash = await bcrypt.hash('Admin@12345', saltRounds);
            await db.query(
                'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
                ['System Administrator', 'admin@oms.com', adminPasswordHash, 'admin']
            );
            console.log('Default admin account created.');
        }

        const [staffRows] = await db.query(
            "SELECT id FROM users WHERE role = 'staff' LIMIT 1"
        );

        if (staffRows.length > 0) {
            console.log('Staff account already exists. Skipping.');
        } else {
            const staffPasswordHash = await bcrypt.hash('Staff@12345', saltRounds);
            await db.query(
                'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
                ['Staff Member', 'staff@oms.com', staffPasswordHash, 'staff']
            );
            console.log('Default staff account created.');
        }

        console.log('=== SEEDING COMPLETE ===');
        console.log('Admin Login: admin@oms.com / Admin@12345');
        console.log('Staff Login: staff@oms.com / Staff@12345');
        console.log('Please change these passwords after first login.');
    } catch (error) {
        console.error('Seeder error:', error);
        process.exitCode = 1;
    } finally {
        try {
            await db.end();
            console.log('Database connection closed.');
        } catch (closeError) {
            console.error('Error closing database connection:', closeError);
            process.exitCode = 1;
        }
    }
}

seedUsers();
