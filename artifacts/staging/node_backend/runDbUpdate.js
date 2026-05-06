const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function run() {
    const hash = bcrypt.hashSync('123456', 10);
    console.log('Generated hash:', hash);

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'orphanage_management_system'
    });

    try {
        await connection.query('UPDATE users SET password = ? WHERE email = ?', [hash, 'admin@gmail.com']);
        console.log('Successfully updated the database with exactly the generated hash (no trailing spaces).');
        
        // Test authController logic directly
        const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', ['admin@gmail.com']);
        const user = rows[0];
        if (user) {
            const cleanHash = user.password.trim();
            const storedHash = cleanHash.replace(/^\$2y\$/, '$2a$');
            
            console.log('DB Validated Hash:', `[${storedHash}]`);
            const passwordMatch = await bcrypt.compare('123456', storedHash);
            console.log('Simulated login Test - bcrypt.compare returned:', passwordMatch);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await connection.end();
    }
}

run();
