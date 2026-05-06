const db = require('../config/db');

function clean(body) {
    const t = (k) => (body[k] != null && String(body[k]).trim() !== '' ? String(body[k]).trim() : null);
    const text = (k) => (body[k] != null ? String(body[k]).trim() : null);
    return {
        reporter_name: t('reporter_name'),
        reporter_email: t('reporter_email'),
        reporter_phone: t('reporter_phone'),
        report_type: t('report_type') || 'Abandoned Child',
        subject: t('subject') || 'Abandoned child report',
        description: text('description'),
        incident_date: t('incident_date'),
        location: t('location'),
        child_age_estimate: t('child_age_estimate'),
        child_gender: t('child_gender'),
        attachment_path: body.attachment_path || null
    };
}

class PublicReport {
    static async create(body) {
        const row = clean(body);
        const cols = [
            'reporter_name',
            'reporter_email',
            'reporter_phone',
            'report_type',
            'subject',
            'description',
            'incident_date',
            'location',
            'child_age_estimate',
            'child_gender',
            'attachment_path'
        ];
        const [result] = await db.query(
            `INSERT INTO public_reports (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`,
            cols.map((c) => row[c])
        );
        return result.insertId;
    }

    static async findAll(search = '', status = '') {
        let sql = 'SELECT * FROM public_reports WHERE 1=1';
        const params = [];
        if (search) {
            sql += ' AND (reporter_name LIKE ? OR reporter_phone LIKE ? OR subject LIKE ? OR location LIKE ?)';
            const like = `%${search}%`;
            params.push(like, like, like, like);
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
        const [rows] = await db.query('SELECT * FROM public_reports WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async updateStatus(id, status, admin_notes) {
        const [result] = await db.query(
            'UPDATE public_reports SET status = ?, admin_notes = ? WHERE id = ?',
            [status, admin_notes || null, id]
        );
        return result.affectedRows > 0;
    }
}

module.exports = PublicReport;
