const db = require('../config/db');

class Child {
    static async findAll(search = '', statusFilter = '') {
        let query = 'SELECT * FROM children WHERE 1=1';
        let params = [];
        
        if (search) {
            query += ' AND name LIKE ?';
            params.push(`%${search}%`);
        }
        
        if (statusFilter) {
            query += ' AND status = ?';
            params.push(statusFilter);
        }
        
        query += ' ORDER BY id DESC';
        const [rows] = await db.query(query, params);
        return rows;
    }

    static async getStats() {
        const [total] = await db.query('SELECT COUNT(*) as count FROM children');
        const [active] = await db.query('SELECT COUNT(*) as count FROM children WHERE status IN ("Available", "Pending", "Processing")');
        const [adopted] = await db.query('SELECT COUNT(*) as count FROM children WHERE status = "Adopted"');
        
        return {
            total: total[0].count,
            active: active[0].count,
            adopted: adopted[0].count
        };
    }

    static async getRecent(limit = 5) {
        const [rows] = await db.query('SELECT * FROM children ORDER BY id DESC LIMIT ?', [limit]);
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM children WHERE id = ?', [id]);
        return rows[0];
    }

    static async create(data) {
        const { name, age, gender, status } = data;
        
        const sql = `
            INSERT INTO children 
            (name, age, gender, status) 
            VALUES (?, ?, ?, ?)
        `;
        const values = [name, age, gender, status];
        
        const [result] = await db.query(sql, values);
        return result.insertId;
    }

    static async update(id, data) {
        const { name, age, gender, status } = data;
        
        const sql = `
            UPDATE children 
            SET name = ?, age = ?, gender = ?, status = ?
            WHERE id = ?
        `;
        const values = [name, age, gender, status, id];
        
        const [result] = await db.query(sql, values);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM children WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Child;
