const mysql = require('mysql2/promise');
require('dotenv').config();

async function test() {
    const c = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        database: 'orphanage_management_system'
    });
    const [rows] = await c.query('SELECT * FROM users');
    rows.forEach(r => {
        console.log(`Email: [${r.email}], Length: ${r.email.length}`);
        console.log(`Hash:  [${r.password}], Length: ${r.password.length}`);
    });
    c.end();
}
test().catch(console.error);
