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
            amount, item_description, item_category, item_quantity, item_condition,
            pickup_required, pickup_address, preferred_pickup_date, item_photo_path,
            message, donation_date, reference, status
        } = data;
        
        const sql = `
            INSERT INTO donations 
            (donor_name, donor_email, phone, donation_type, currency, payment_method, amount, item_description,
             item_category, item_quantity, item_condition, pickup_required, pickup_address, preferred_pickup_date,
             item_photo_path, message, donation_date, reference, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
            donor_name,
            donor_email,
            phone || null,
            donation_type,
            currency || null,
            payment_method || null,
            amount || null,
            item_description || null,
            item_category || null,
            item_quantity || null,
            item_condition || null,
            pickup_required ? 1 : 0,
            pickup_address || null,
            preferred_pickup_date || null,
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
            amount, item_description, item_category, item_quantity, item_condition,
            pickup_required, pickup_address, preferred_pickup_date, item_photo_path,
            message, donation_date
        } = data;
        
        const sql = `
            UPDATE donations 
            SET donor_name = ?, donor_email = ?, phone = ?, donation_type = ?, currency = ?, payment_method = ?,
                amount = ?, item_description = ?, item_category = ?, item_quantity = ?, item_condition = ?,
                pickup_required = ?, pickup_address = ?, preferred_pickup_date = ?, item_photo_path = COALESCE(?, item_photo_path),
                message = ?, donation_date = ?
            WHERE id = ?
        `;
        const values = [
            donor_name,
            donor_email,
            phone || null,
            donation_type,
            currency || null,
            payment_method || null,
            amount || null,
            item_description || null,
            item_category || null,
            item_quantity || null,
            item_condition || null,
            pickup_required ? 1 : 0,
            pickup_address || null,
            preferred_pickup_date || null,
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

    static async updateStatusById(id, status) {
        const [result] = await db.query('UPDATE donations SET status = ? WHERE id = ?', [status, id]);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM donations WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Donation;
