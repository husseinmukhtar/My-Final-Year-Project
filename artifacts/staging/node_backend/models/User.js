const db = require('../config/db');

class User {
    static async findByEmail(email) {
        const [rows] = await db.query('SELECT id, full_name, email, password, role FROM users WHERE email = ?', [email]);
        return rows[0];
    }
}

module.exports = User;
