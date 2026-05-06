const db = require('../config/db');

class Adoption {
    static async findAll(search = '') {
        let query = 'SELECT * FROM adoption_requests WHERE 1=1';
        let params = [];
        
        if (search) {
            query += ' AND applicant_name LIKE ?';
            params.push(`%${search}%`);
        }
        
        query += ' ORDER BY id DESC';
        const [rows] = await db.query(query, params);
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM adoption_requests WHERE id = ?', [id]);
        return rows[0];
    }

    static async create(data) {
        const { applicant_name, email, phone, address, child_name, status, request_date } = data;
        
        const sql = `
            INSERT INTO adoption_requests 
            (applicant_name, email, phone, address, child_name, status, request_date) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [applicant_name, email, phone, address, child_name, status, request_date];
        
        const [result] = await db.query(sql, values);
        return result.insertId;
    }

    static async update(id, data) {
        const { applicant_name, email, phone, address, child_name, status, request_date } = data;
        
        const sql = `
            UPDATE adoption_requests 
            SET applicant_name = ?, email = ?, phone = ?, address = ?, child_name = ?, status = ?, request_date = ?
            WHERE id = ?
        `;
        const values = [applicant_name, email, phone, address, child_name, status, request_date, id];
        
        const [result] = await db.query(sql, values);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM adoption_requests WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Adoption;
