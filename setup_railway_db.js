/**
 * Run this once to create all tables on Railway MySQL
 * Usage: node setup_railway_db.js
 */
const mysql = require('mysql2/promise');

async function setup() {
    const conn = await mysql.createConnection({
        host: 'turntable.proxy.rlwy.net',
        port: 35454,
        user: 'root',
        password: 'YMZrAVrcnLbNenGyqTTJLRwDvpnadAFj',
        database: 'railway',
        ssl: { rejectUnauthorized: false }
    });

    console.log('Connected to Railway MySQL...');

    const tables = [
        `CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(200) NOT NULL,
            email VARCHAR(200) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            role ENUM('admin','staff') DEFAULT 'admin',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS children (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(200),
            first_name VARCHAR(120),
            middle_name VARCHAR(120),
            last_name VARCHAR(120),
            child_public_id VARCHAR(32),
            date_of_birth DATE,
            place_of_birth VARCHAR(200),
            nationality VARCHAR(120),
            state_of_origin VARCHAR(120),
            gender ENUM('Male','Female','Other'),
            age INT,
            status ENUM('Active','Adopted','Transferred','Deceased') DEFAULT 'Active',
            dormitory VARCHAR(100) DEFAULT 'Unassigned',
            admission_date DATE,
            registration_number VARCHAR(120),
            passport_photo_path VARCHAR(500),
            father_name VARCHAR(200),
            mother_name VARCHAR(200),
            guardian_name VARCHAR(200),
            guardian_phone VARCHAR(40),
            guardian_address TEXT,
            relationship_to_child VARCHAR(120),
            family_status VARCHAR(40),
            blood_group VARCHAR(10),
            genotype VARCHAR(10),
            known_allergies TEXT,
            medical_conditions TEXT,
            disability VARCHAR(8),
            education_level VARCHAR(120),
            school_name VARCHAR(200),
            skills TEXT,
            languages TEXT,
            hobbies TEXT,
            supporting_document_path VARCHAR(500),
            notes TEXT,
            is_draft TINYINT(1) DEFAULT 0,
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS staff (
            id INT AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(200) NOT NULL,
            email VARCHAR(200),
            phone VARCHAR(40),
            role VARCHAR(100),
            address TEXT,
            date_joined DATE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS donations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            donor_name VARCHAR(200),
            donor_email VARCHAR(200),
            phone VARCHAR(40),
            donation_type ENUM('Monetary','Item') DEFAULT 'Monetary',
            currency VARCHAR(10) DEFAULT 'USD',
            payment_method VARCHAR(50),
            amount DECIMAL(15,2),
            item_description TEXT,
            item_name VARCHAR(200),
            quantity INT,
            item_condition VARCHAR(50),
            item_photo_path VARCHAR(500),
            message TEXT,
            donation_date DATE,
            reference VARCHAR(100),
            status VARCHAR(50) DEFAULT 'Pending',
            pickup_date DATE,
            pickup_address TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS adoptions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            child_id INT,
            adopter_full_name VARCHAR(200),
            adopter_gender VARCHAR(20),
            adopter_dob DATE,
            adopter_phone VARCHAR(40),
            adopter_nationality VARCHAR(120),
            adopter_phone_country_iso VARCHAR(5),
            adopter_phone_country_code VARCHAR(10),
            adopter_email VARCHAR(200),
            adopter_address TEXT,
            occupation VARCHAR(120),
            marital_status VARCHAR(50),
            number_of_children INT DEFAULT 0,
            income_level VARCHAR(50),
            house_type VARCHAR(50),
            identification_type VARCHAR(50),
            identification_number VARCHAR(100),
            adoption_status ENUM('Pending','Accepted','Scheduled','Rejected','Completed') DEFAULT 'Pending',
            application_date DATE,
            visit_date DATE,
            visit_time TIME,
            visit_notes TEXT,
            rejection_reason TEXT,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE SET NULL
        )`,
        `CREATE TABLE IF NOT EXISTS public_admissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            guardian_name VARCHAR(200),
            guardian_phone VARCHAR(40),
            guardian_email VARCHAR(200),
            relationship_to_child VARCHAR(120),
            child_name VARCHAR(200),
            child_age INT,
            child_gender VARCHAR(20),
            admission_reason TEXT,
            supporting_document_path VARCHAR(500),
            status ENUM('Pending','Reviewed','Accepted','Rejected') DEFAULT 'Pending',
            admin_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS public_reports (
            id INT AUTO_INCREMENT PRIMARY KEY,
            reporter_name VARCHAR(200),
            reporter_phone VARCHAR(40),
            reporter_email VARCHAR(200),
            report_type VARCHAR(100),
            subject VARCHAR(200),
            location TEXT,
            child_age_estimate VARCHAR(50),
            child_gender VARCHAR(20),
            description TEXT,
            attachment_path VARCHAR(500),
            status ENUM('Pending','Reviewed','Resolved') DEFAULT 'Pending',
            admin_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`,
        `CREATE TABLE IF NOT EXISTS reported_children (
            id INT AUTO_INCREMENT PRIMARY KEY,
            reporter_name VARCHAR(200),
            reporter_phone VARCHAR(40),
            reporter_email VARCHAR(200),
            location TEXT,
            child_age_estimate VARCHAR(50),
            child_gender VARCHAR(20),
            description TEXT,
            photo_path VARCHAR(500),
            status ENUM('Pending','Reviewed','Resolved') DEFAULT 'Pending',
            admin_notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
    ];

    for (const sql of tables) {
        const tableName = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)[1];
        try {
            await conn.execute(sql);
            console.log(`✅ Table "${tableName}" created/verified`);
        } catch (e) {
            console.error(`❌ Error with "${tableName}": ${e.message}`);
        }
    }

    // Create default admin user (password: admin123)
    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash('admin123', 10);
    try {
        await conn.execute(
            `INSERT IGNORE INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)`,
            ['Administrator', 'admin@orphanage.com', hash, 'admin']
        );
        console.log('✅ Default admin user created: admin@orphanage.com / admin123');
    } catch (e) {
        console.log('Admin user already exists');
    }

    await conn.end();
    console.log('\n✅ Database setup complete!');
}

setup().catch(console.error);
