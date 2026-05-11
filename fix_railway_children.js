require('dotenv').config({ path: './node_backend/.env' });
const mysql = require('mysql2/promise');

async function fixChildren() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: { rejectUnauthorized: false }
    });

    console.log('Connected to Railway DB');

    const columns = [
        "ADD COLUMN IF NOT EXISTS first_name VARCHAR(100) NULL",
        "ADD COLUMN IF NOT EXISTS middle_name VARCHAR(100) NULL",
        "ADD COLUMN IF NOT EXISTS last_name VARCHAR(100) NULL",
        "ADD COLUMN IF NOT EXISTS place_of_birth VARCHAR(150) NULL",
        "ADD COLUMN IF NOT EXISTS nationality VARCHAR(100) NULL",
        "ADD COLUMN IF NOT EXISTS state_of_origin VARCHAR(100) NULL",
        "ADD COLUMN IF NOT EXISTS admission_date DATE NULL",
        "ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100) NULL",
        "ADD COLUMN IF NOT EXISTS father_name VARCHAR(150) NULL",
        "ADD COLUMN IF NOT EXISTS mother_name VARCHAR(150) NULL",
        "ADD COLUMN IF NOT EXISTS guardian_name VARCHAR(150) NULL",
        "ADD COLUMN IF NOT EXISTS guardian_phone VARCHAR(30) NULL",
        "ADD COLUMN IF NOT EXISTS guardian_address TEXT NULL",
        "ADD COLUMN IF NOT EXISTS relationship_to_child VARCHAR(100) NULL",
        "ADD COLUMN IF NOT EXISTS family_status VARCHAR(100) NULL",
        "ADD COLUMN IF NOT EXISTS blood_group VARCHAR(10) NULL",
        "ADD COLUMN IF NOT EXISTS genotype VARCHAR(10) NULL",
        "ADD COLUMN IF NOT EXISTS known_allergies TEXT NULL",
        "ADD COLUMN IF NOT EXISTS medical_conditions TEXT NULL",
        "ADD COLUMN IF NOT EXISTS disability VARCHAR(10) DEFAULT 'No'",
        "ADD COLUMN IF NOT EXISTS disability_description TEXT NULL",
        "ADD COLUMN IF NOT EXISTS last_medical_checkup DATE NULL",
        "ADD COLUMN IF NOT EXISTS hospital_or_doctor VARCHAR(200) NULL",
        "ADD COLUMN IF NOT EXISTS vaccination_status VARCHAR(100) NULL",
        "ADD COLUMN IF NOT EXISTS current_school VARCHAR(200) NULL",
        "ADD COLUMN IF NOT EXISTS class_grade VARCHAR(100) NULL",
        "ADD COLUMN IF NOT EXISTS enrollment_status VARCHAR(100) NULL",
        "ADD COLUMN IF NOT EXISTS academic_level VARCHAR(100) NULL",
        "ADD COLUMN IF NOT EXISTS special_learning_needs TEXT NULL",
        "ADD COLUMN IF NOT EXISTS dormitory_room VARCHAR(100) NULL",
        "ADD COLUMN IF NOT EXISTS bed_number VARCHAR(50) NULL",
        "ADD COLUMN IF NOT EXISTS date_assigned_accommodation DATE NULL",
        "ADD COLUMN IF NOT EXISTS caregiver_assigned VARCHAR(150) NULL",
        "ADD COLUMN IF NOT EXISTS admission_reason TEXT NULL",
        "ADD COLUMN IF NOT EXISTS case_file_number VARCHAR(100) NULL",
        "ADD COLUMN IF NOT EXISTS legal_guardian_approval VARCHAR(50) NULL",
        "ADD COLUMN IF NOT EXISTS supporting_document_path VARCHAR(500) NULL",
        "ADD COLUMN IF NOT EXISTS behavior_notes TEXT NULL",
        "ADD COLUMN IF NOT EXISTS special_needs_notes TEXT NULL",
        "ADD COLUMN IF NOT EXISTS staff_remarks TEXT NULL",
        "ADD COLUMN IF NOT EXISTS is_draft TINYINT(1) DEFAULT 0",
        "ADD COLUMN IF NOT EXISTS child_public_id VARCHAR(50) NULL",
        "ADD COLUMN IF NOT EXISTS passport_photo_path VARCHAR(500) NULL",
        "ADD COLUMN IF NOT EXISTS created_by_user_id INT NULL",
        "ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
    ];

    // Also fix adoptions table missing columns
    const adoptionColumns = [
        "ADD COLUMN IF NOT EXISTS applicant_location VARCHAR(300) NULL",
        "ADD COLUMN IF NOT EXISTS agreed_to_terms TINYINT(1) DEFAULT 0",
        "ADD COLUMN IF NOT EXISTS adopter_gender VARCHAR(20) NULL",
        "ADD COLUMN IF NOT EXISTS adopter_dob DATE NULL",
        "ADD COLUMN IF NOT EXISTS adopter_nationality VARCHAR(100) NULL",
        "ADD COLUMN IF NOT EXISTS adopter_phone_country_iso VARCHAR(10) NULL",
        "ADD COLUMN IF NOT EXISTS adopter_phone_country_code VARCHAR(10) NULL",
        "ADD COLUMN IF NOT EXISTS occupation VARCHAR(150) NULL",
        "ADD COLUMN IF NOT EXISTS marital_status VARCHAR(50) NULL",
        "ADD COLUMN IF NOT EXISTS number_of_children INT DEFAULT 0",
        "ADD COLUMN IF NOT EXISTS income_level VARCHAR(50) NULL",
        "ADD COLUMN IF NOT EXISTS house_type VARCHAR(100) NULL",
        "ADD COLUMN IF NOT EXISTS assigned_staff VARCHAR(150) NULL",
        "ADD COLUMN IF NOT EXISTS visit_scheduled_at DATETIME NULL",
        "ADD COLUMN IF NOT EXISTS approval_date DATE NULL"
    ];

    try {
        // Fix children table
        for (const col of columns) {
            try {
                await conn.query(`ALTER TABLE children ${col}`);
                console.log(`✅ children: ${col.split('IF NOT EXISTS ')[1]?.split(' ')[0] || col}`);
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    console.log(`⏭ Already exists: ${col}`);
                } else {
                    console.error(`❌ Error: ${col}`, e.message);
                }
            }
        }

        // Fix adoptions table
        for (const col of adoptionColumns) {
            try {
                await conn.query(`ALTER TABLE adoptions ${col}`);
                console.log(`✅ adoptions: ${col.split('IF NOT EXISTS ')[1]?.split(' ')[0] || col}`);
            } catch (e) {
                if (e.code === 'ER_DUP_FIELDNAME') {
                    console.log(`⏭ Already exists: ${col}`);
                } else {
                    console.error(`❌ Error: ${col}`, e.message);
                }
            }
        }

        console.log('\n✅ All done! Railway database columns fixed.');
    } catch (err) {
        console.error('Fatal error:', err);
    } finally {
        await conn.end();
    }
}

fixChildren();
