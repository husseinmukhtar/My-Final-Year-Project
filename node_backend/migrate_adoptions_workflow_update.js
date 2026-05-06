/**
 * Alters existing `adoptions` table for acceptance/scheduling workflow and phone-country metadata.
 * Run: node migrate_adoptions_workflow_update.js
 */
const pool = require('./config/db');

const columns = [
    {
        name: 'adopter_nationality',
        sql: `ALTER TABLE adoptions ADD COLUMN adopter_nationality VARCHAR(80) NULL AFTER adopter_phone`
    },
    {
        name: 'adopter_phone_country_iso',
        sql: `ALTER TABLE adoptions ADD COLUMN adopter_phone_country_iso VARCHAR(8) NULL AFTER adopter_nationality`
    },
    {
        name: 'adopter_phone_country_code',
        sql: `ALTER TABLE adoptions ADD COLUMN adopter_phone_country_code VARCHAR(8) NULL AFTER adopter_phone_country_iso`
    },
    {
        name: 'approval_date',
        sql: `ALTER TABLE adoptions ADD COLUMN approval_date DATE NULL AFTER application_date`
    },
    {
        name: 'visit_scheduled_at',
        sql: `ALTER TABLE adoptions ADD COLUMN visit_scheduled_at DATETIME NULL AFTER approval_date`
    },
    {
        name: 'assigned_staff',
        sql: `ALTER TABLE adoptions ADD COLUMN assigned_staff VARCHAR(200) NULL AFTER visit_scheduled_at`
    },
    {
        name: 'notes',
        sql: `ALTER TABLE adoptions ADD COLUMN notes TEXT NULL AFTER assigned_staff`
    }
];

async function run() {
    try {
        for (const column of columns) {
            const [rows] = await pool.query(
                `SELECT 1
                 FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE()
                   AND TABLE_NAME = 'adoptions'
                   AND COLUMN_NAME = ?
                 LIMIT 1`,
                [column.name]
            );
            if (rows.length > 0) {
                console.log(`SKIP: ${column.name} already exists`);
                continue;
            }
            await pool.query(column.sql);
            console.log(`OK: ${column.sql}`);
        }

        await pool.query(`UPDATE adoptions SET adoption_status = 'Accepted' WHERE adoption_status = 'Approved'`);
        console.log(`OK: normalized legacy adoption_status values from 'Approved' to 'Accepted'`);
        console.log('Adoptions workflow update migration finished.');
    } catch (e) {
        console.error(e.message);
        process.exit(1);
    }
    process.exit(0);
}

run();
