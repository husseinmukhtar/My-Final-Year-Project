const pool = require('./config/db');

async function columnExists(table, column) {
    const [rows] = await pool.query(
        `SELECT COLUMN_NAME
         FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?`,
        [table, column]
    );
    return rows.length > 0;
}

async function addColumnIfMissing(table, column, definition) {
    if (await columnExists(table, column)) return;
    await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`Added ${table}.${column}`);
}

async function updateEnum(table, column, definition) {
    await pool.query(`ALTER TABLE ${table} MODIFY COLUMN ${column} ${definition}`);
    console.log(`Updated ${table}.${column}`);
}

async function run() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS public_reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            reporter_name VARCHAR(150) NOT NULL,
            reporter_email VARCHAR(150) NULL,
            reporter_phone VARCHAR(40) NULL,
            report_type VARCHAR(80) NOT NULL,
            subject VARCHAR(200) NOT NULL,
            description TEXT NOT NULL,
            incident_date DATE NULL,
            location VARCHAR(255) NULL,
            child_age_estimate VARCHAR(40) NULL,
            child_gender VARCHAR(20) NULL,
            attachment_path VARCHAR(500) NULL,
            status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
            admin_notes TEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS public_admissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            guardian_name VARCHAR(150) NOT NULL,
            guardian_email VARCHAR(150) NULL,
            guardian_phone VARCHAR(40) NOT NULL,
            guardian_address TEXT NULL,
            relationship_to_child VARCHAR(120) NULL,
            child_name VARCHAR(150) NOT NULL,
            child_gender VARCHAR(20) NOT NULL,
            child_date_of_birth DATE NULL,
            child_age INT NULL,
            current_location VARCHAR(255) NULL,
            admission_reason TEXT NOT NULL,
            medical_notes TEXT NULL,
            supporting_document_path VARCHAR(500) NULL,
            status ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending',
            admin_notes TEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `);

    await addColumnIfMissing('public_reports', 'child_age_estimate', 'VARCHAR(40) NULL AFTER location');
    await addColumnIfMissing('public_reports', 'child_gender', 'VARCHAR(20) NULL AFTER child_age_estimate');

    await pool.query("UPDATE public_reports SET status = 'Pending' WHERE status IN ('new','reviewing') OR status IS NULL OR status = ''");
    await pool.query("UPDATE public_reports SET status = 'Approved' WHERE status = 'resolved'");
    await pool.query("UPDATE public_reports SET status = 'Rejected' WHERE status = 'dismissed'");
    await updateEnum('public_reports', 'reporter_email', 'VARCHAR(150) NULL');
    await updateEnum('public_reports', 'status', "ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending'");

    await pool.query("UPDATE public_admissions SET status = 'Pending' WHERE status IN ('new','reviewing') OR status IS NULL OR status = ''");
    await pool.query("UPDATE public_admissions SET status = 'Approved' WHERE status = 'accepted'");
    await pool.query("UPDATE public_admissions SET status = 'Rejected' WHERE status = 'declined'");
    await updateEnum('public_admissions', 'guardian_email', 'VARCHAR(150) NULL');
    await updateEnum('public_admissions', 'guardian_address', 'TEXT NULL');
    await updateEnum('public_admissions', 'status', "ENUM('Pending','Approved','Rejected') NOT NULL DEFAULT 'Pending'");

    await addColumnIfMissing('donations', 'item_category', 'VARCHAR(120) NULL AFTER item_description');
    await addColumnIfMissing('donations', 'item_quantity', 'VARCHAR(80) NULL AFTER item_category');
    await addColumnIfMissing('donations', 'item_condition', 'VARCHAR(80) NULL AFTER item_quantity');
    await addColumnIfMissing('donations', 'pickup_required', 'TINYINT(1) NOT NULL DEFAULT 0 AFTER item_condition');
    await addColumnIfMissing('donations', 'pickup_address', 'TEXT NULL AFTER pickup_required');
    await addColumnIfMissing('donations', 'preferred_pickup_date', 'DATE NULL AFTER pickup_address');
    await addColumnIfMissing('donations', 'item_photo_path', 'VARCHAR(500) NULL AFTER preferred_pickup_date');
    await updateEnum('donations', 'status', "ENUM('pending','successful','failed','awaiting_confirmation','approved','rejected') DEFAULT 'pending'");

    console.log('Public feature schema is ready.');
}

run()
    .catch((err) => {
        console.error('Migration failed:', err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await pool.end();
    });
