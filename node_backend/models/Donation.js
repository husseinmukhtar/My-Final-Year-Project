const db = require('../config/db');

class Donation {
    static async findAll(search = '') {
        let query = 'SELECT * FROM donations WHERE 1=1';
        let params = [];
        
        if (search) {
            query += ' AND donor_name LIKE ?';
            params.push(`%${search}%`);
        }
        
        query += ' ORDER BY id DESC';
        const [rows] = await db.query(query, params);
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM donations WHERE id = ?', [id]);
        return rows[0];
    }

    static async create(data) {
        const {
            donor_name, donor_email, phone, donation_type, currency, payment_method,
            amount, item_description, item_name, quantity, item_condition, item_photo_path,
            message, donation_date, reference, status
        } = data;
        
        const sql = `
            INSERT INTO donations 
            (donor_name, donor_email, phone, donation_type, currency, payment_method, amount,
             item_description, item_name, quantity, item_condition, item_photo_path, message,
             donation_date, reference, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            donor_name,
            donor_email,
            phone || null,
            donation_type,
            currency,
            payment_method,
            amount,
            item_description,
            item_name || null,
            quantity || null,
            item_condition || null,
            item_photo_path || null,
            message || null,
            donation_date,
            reference || null,
            status || 'pending'
        ];
        
        const [result] = await db.query(sql, values);
        return result.insertId;
    }

    static async update(id, data) {
        const {
            donor_name, donor_email, phone, donation_type, currency, payment_method,
            amount, item_description, item_name, quantity, item_condition, item_photo_path,
            message, donation_date
        } = data;
        
        const sql = `
            UPDATE donations 
            SET donor_name = ?, donor_email = ?, phone = ?, donation_type = ?, currency = ?,
                payment_method = ?, amount = ?, item_description = ?, item_name = ?,
                quantity = ?, item_condition = ?, item_photo_path = COALESCE(?, item_photo_path),
                message = ?, donation_date = ?
            WHERE id = ?
        `;
        const values = [
            donor_name,
            donor_email,
            phone || null,
            donation_type,
            currency,
            payment_method,
            amount,
            item_description,
            item_name || null,
            quantity || null,
            item_condition || null,
            item_photo_path || null,
            message || null,
            donation_date,
            id
        ];
        
        const [result] = await db.query(sql, values);
        return result.affectedRows > 0;
    }

    static async findByReference(reference) {
        const [rows] = await db.query('SELECT * FROM donations WHERE reference = ?', [reference]);
        return rows[0];
    }

    static async updateStatus(reference, status, paid_at = null) {
        const sql = `UPDATE donations SET status = ?, paid_at = ? WHERE reference = ?`;
        const [result] = await db.query(sql, [status, paid_at, reference]);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM donations WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Donation;
