const db = require('../config/db');

class User {
    static async findByEmail(email) {
        const [rows] = await db.query('SELECT id, full_name, email, password, role FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async create(userData) {
        const { full_name, email, password, role } = userData;
        const [result] = await db.query(
            'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
            [full_name, email, password, role || 'staff']
        );
        return result.insertId;
    }
}

module.exports = User;
