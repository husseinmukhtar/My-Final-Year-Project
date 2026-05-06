/**
 * One-time migration: expands `children` for the detailed registration form.
 * Run from node_backend: node migrate_children_schema.js
 */
const pool = require('./config/db');

const statements = [
    "ADD COLUMN child_public_id VARCHAR(32) NULL",
    "ADD COLUMN first_name VARCHAR(120) NULL",
    "ADD COLUMN middle_name VARCHAR(120) NULL",
    "ADD COLUMN last_name VARCHAR(120) NULL",
    "ADD COLUMN date_of_birth DATE NULL",
    "ADD COLUMN place_of_birth VARCHAR(200) NULL",
    "ADD COLUMN nationality VARCHAR(120) NULL",
    "ADD COLUMN state_of_origin VARCHAR(120) NULL",
    "ADD COLUMN admission_date DATE NULL",
    "ADD COLUMN registration_number VARCHAR(120) NULL",
    "ADD COLUMN passport_photo_path VARCHAR(500) NULL",
    "ADD COLUMN father_name VARCHAR(200) NULL",
    "ADD COLUMN mother_name VARCHAR(200) NULL",
    "ADD COLUMN guardian_name VARCHAR(200) NULL",
    "ADD COLUMN guardian_phone VARCHAR(40) NULL",
    "ADD COLUMN guardian_address TEXT NULL",
    "ADD COLUMN relationship_to_child VARCHAR(120) NULL",
    "ADD COLUMN family_status VARCHAR(40) NULL",
    "ADD COLUMN blood_group VARCHAR(10) NULL",
    "ADD COLUMN genotype VARCHAR(10) NULL",
    "ADD COLUMN known_allergies TEXT NULL",
    "ADD COLUMN medical_conditions TEXT NULL",
    "ADD COLUMN disability VARCHAR(8) NULL",
    "ADD COLUMN disability_description TEXT NULL",
    "ADD COLUMN last_medical_checkup DATE NULL",
    "ADD COLUMN hospital_or_doctor VARCHAR(255) NULL",
    "ADD COLUMN vaccination_status VARCHAR(40) NULL",
    "ADD COLUMN current_school VARCHAR(255) NULL",
    "ADD COLUMN class_grade VARCHAR(80) NULL",
    "ADD COLUMN enrollment_status VARCHAR(40) NULL",
    "ADD COLUMN academic_level VARCHAR(40) NULL",
    "ADD COLUMN special_learning_needs TEXT NULL",
    "ADD COLUMN dormitory_room VARCHAR(120) NULL",
    "ADD COLUMN bed_number VARCHAR(40) NULL",
    "ADD COLUMN date_assigned_accommodation DATE NULL",
    "ADD COLUMN caregiver_assigned VARCHAR(200) NULL",
    "ADD COLUMN admission_reason TEXT NULL",
    "ADD COLUMN case_file_number VARCHAR(120) NULL",
    "ADD COLUMN legal_guardian_approval VARCHAR(8) NULL",
    "ADD COLUMN supporting_document_path VARCHAR(500) NULL",
    "ADD COLUMN behavior_notes TEXT NULL",
    "ADD COLUMN special_needs_notes TEXT NULL",
    "ADD COLUMN staff_remarks TEXT NULL",
    "ADD COLUMN is_draft TINYINT(1) NOT NULL DEFAULT 0",
    "ADD COLUMN created_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP",
    "ADD COLUMN updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    "ADD COLUMN created_by_user_id INT NULL",
    "ADD UNIQUE KEY uk_child_public_id (child_public_id)"
];

async function run() {
    for (const frag of statements) {
        const sql = `ALTER TABLE children ${frag}`;
        try {
            await pool.query(sql);
            console.log('OK:', frag.slice(0, 60) + '...');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME' || e.code === 'ER_DUP_KEYNAME') {
                console.log('Skip (exists):', frag.slice(0, 50));
            } else {
                console.error('Failed:', frag, e.message);
            }
        }
    }
    try {
        await pool.query(`
            UPDATE children
            SET first_name = TRIM(SUBSTRING_INDEX(name, ' ', 1)),
                last_name = TRIM(SUBSTRING_INDEX(name, ' ', -1))
            WHERE (first_name IS NULL OR TRIM(first_name) = '')
              AND (last_name IS NULL OR TRIM(last_name) = '')
              AND name IS NOT NULL AND TRIM(name) <> ''
        `);
        console.log('Backfilled first/last name from legacy name column where needed.');
    } catch (e) {
        console.log('Backfill skip:', e.message);
    }

    console.log('Migration pass finished.');
    process.exit(0);
}

run().catch((e) => {
    console.error(e);
    process.exit(1);
});
