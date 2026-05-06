const db = require('../config/db');

function clean(body) {
    const t = (k) => (body[k] != null && String(body[k]).trim() !== '' ? String(body[k]).trim() : null);
    const text = (k) => (body[k] != null ? String(body[k]).trim() : null);
    const age = body.child_age != null && String(body.child_age).trim() !== '' ? parseInt(body.child_age, 10) : null;
    return {
        guardian_name: t('guardian_name'),
        guardian_email: t('guardian_email'),
        guardian_phone: t('guardian_phone'),
        guardian_address: text('guardian_address'),
        relationship_to_child: t('relationship_to_child'),
        child_name: t('child_name'),
        child_gender: t('child_gender'),
        child_date_of_birth: t('child_date_of_birth'),
        child_age: Number.isFinite(age) ? age : null,
        current_location: t('current_location'),
        admission_reason: text('admission_reason'),
        medical_notes: text('medical_notes'),
        supporting_document_path: body.supporting_document_path || null
    };
}

class PublicAdmission {
    static async create(body) {
        const row = clean(body);
        const cols = [
            'guardian_name',
            'guardian_email',
            'guardian_phone',
            'guardian_address',
            'relationship_to_child',
            'child_name',
            'child_gender',
            'child_date_of_birth',
            'child_age',
            'current_location',
            'admission_reason',
            'medical_notes',
            'supporting_document_path'
        ];
        const [result] = await db.query(
            `INSERT INTO public_admissions (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
            cols.map((c) => row[c])
        );
        return result.insertId;
    }

    static async findAll(search = '', status = '') {
        let sql = 'SELECT * FROM public_admissions WHERE 1=1';
        const params = [];
        if (search) {
            sql += ' AND (guardian_name LIKE ? OR guardian_email LIKE ? OR child_name LIKE ?)';
            const like = `%${search}%`;
            params.push(like, like, like);
        }
        if (status) {
            sql += ' AND status = ?';
            params.push(status);
        }
        sql += ' ORDER BY created_at DESC, id DESC';
        const [rows] = await db.query(sql, params);
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query('SELECT * FROM public_admissions WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async updateStatus(id, status, admin_notes) {
        const [result] = await db.query(
            'UPDATE public_admissions SET status = ?, admin_notes = ? WHERE id = ?',
            [status, admin_notes || null, id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = PublicAdmission;
