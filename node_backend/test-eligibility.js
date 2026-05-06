const db = require('./config/db');

async function test() {
    try {
        const [rows] = await db.query('SELECT id, name, status, is_draft FROM children');
        console.log('ALL CHILDREN:', rows);

        const [rows2] = await db.query(`SELECT c.*
             FROM children c
             WHERE (c.is_draft IS NULL OR c.is_draft = 0)
               AND (
                 (c.status <> 'Adopted'
                  AND NOT EXISTS (
                    SELECT 1 FROM adoptions a
                    WHERE a.child_id = c.id AND a.adoption_status = 'Completed'
                  ))
               )`);
        console.log('ELIGIBLE CHILDREN:', rows2.map(r => r.id));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
test();
