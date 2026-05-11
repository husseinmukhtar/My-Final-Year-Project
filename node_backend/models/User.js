const db     = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
    static async findByEmail(email) {
        const [rows] = await db.query(
            'SELECT id, full_name, email, password, role FROM users WHERE email = ?',
            [email]
        );
        return rows[0];
    }

    /**
     * Create a new user with a properly bcrypt-hashed password.
     * Always use this method — never INSERT a plain-text password directly.
     */
    static async create({ full_name, email, password, role = 'staff' }) {
        const hash = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)',
            [full_name, email, hash, role]
        );
        return result.insertId;
    }
}

module.exports = User;
