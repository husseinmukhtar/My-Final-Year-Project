const db = require('./config/db');

async function fix() {
    try {
        await db.query(`UPDATE children SET status = 'Available' WHERE id = 12`);
        console.log('Child 12 updated successfully.');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
fix();
