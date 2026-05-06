const db = require('../config/db');

class Staff {
    static async findAll(search = '') {
        let query = 'SELECT * FROM staff WHERE 1=1';
        let params = [];
        
        if (search) {
            query += ' AND full_name LIKE ?';
            params.push(`%${search}%`);
        }
        
        query += ' ORDER BY id DESC';
        const [rows] = await db.query(query, params);
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM staff WHERE id = ?', [id]);
        return rows[0];
    }

    static async findByEmailExcludingId(email, idToExclude = null) {
        let query = 'SELECT id FROM staff WHERE email = ?';
        let params = [email];

        if (idToExclude) {
            query += ' AND id != ?';
            params.push(idToExclude);
        }

        const [rows] = await db.query(query, params);
        return rows.length > 0;
    }

    static async create(data) {
        const { full_name, email, phone, role, address, date_joined } = data;
        
        const sql = `
            INSERT INTO staff 
            (full_name, email, phone, role, address, date_joined) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const values = [full_name, email, phone, role, address, date_joined];
        
        const [result] = await db.query(sql, values);
        return result.insertId;
    }

    static async update(id, data) {
        const { full_name, email, phone, role, address, date_joined } = data;
        
        const sql = `
            UPDATE staff 
            SET full_name = ?, email = ?, phone = ?, role = ?, address = ?, date_joined = ?
            WHERE id = ?
        `;
        const values = [full_name, email, phone, role, address, date_joined, id];
        
        const [result] = await db.query(sql, values);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM staff WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Staff;
