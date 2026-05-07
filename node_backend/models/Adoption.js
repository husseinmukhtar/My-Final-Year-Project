const db = require('../config/db');

const ADOPTION_STATUSES = ['Pending', 'Accepted', 'Scheduled', 'Rejected', 'Completed'];

function childDisplayName(row) {
    if (!row) return '';
    const fn = row.child_first_name ?? row.first_name;
    const mn = row.child_middle_name ?? row.middle_name;
    const ln = row.child_last_name ?? row.last_name;
    const nm = row.child_name ?? row.name;
    const parts = [fn, mn, ln].map((s) => (s || '').trim()).filter(Boolean);
    if (parts.length) return parts.join(' ');
    return nm || '';
}

function mapBody(body) {
    const t = (k) => (body[k] != null && String(body[k]).trim() !== '' ? String(body[k]).trim() : null);
    const tText = (k) => (body[k] != null ? String(body[k]) : null);
    return {
        child_id: body.child_id != null ? parseInt(body.child_id, 10) : null,
        adopter_full_name: t('adopter_full_name'),
        adopter_gender: t('adopter_gender'),
        adopter_dob: t('adopter_dob'),
        adopter_phone: t('adopter_phone'),
        adopter_nationality: t('adopter_nationality'),
        adopter_phone_country_iso: t('adopter_phone_country_iso'),
        adopter_phone_country_code: t('adopter_phone_country_code'),
        adopter_email: t('adopter_email'),
        adopter_address: tText('adopter_address'),
        occupation: t('occupation'),
        marital_status: t('marital_status'),
        number_of_children: body.number_of_children != null && body.number_of_children !== ''
            ? Math.max(0, parseInt(body.number_of_children, 10) || 0)
            : 0,
        income_level: t('income_level'),
        house_type: t('house_type'),
        identification_type: t('identification_type'),
        identification_number: t('identification_number'),
        adoption_status: t('adoption_status') || 'Pending',
        application_date: t('application_date'),
        approval_date: t('approval_date'),
        visit_scheduled_at: t('visit_scheduled_at'),
        assigned_staff: t('assigned_staff'),
        notes: tText('notes')
    };
}

class Adoption {
    static get STATUSES() {
        return ADOPTION_STATUSES;
    }

    static async findAll(search = '', statusFilter = '') {
        let sql = `
            SELECT a.*,
                   c.first_name AS child_first_name,
                   c.middle_name AS child_middle_name,
                   c.last_name AS child_last_name,
                   c.name AS child_name,
                   c.child_public_id AS child_public_id
            FROM adoptions a
            INNER JOIN children c ON c.id = a.child_id
            WHERE 1=1
        `;
        const params = [];
        if (search) {
            sql += ` AND (
                a.adopter_full_name LIKE ? OR a.adopter_email LIKE ?
                OR c.name LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ?
                OR c.child_public_id LIKE ?
            )`;
            const like = `%${search}%`;
            params.push(like, like, like, like, like, like);
        }
        if (statusFilter) {
            sql += ' AND a.adoption_status = ?';
            params.push(statusFilter);
        }
        sql += ' ORDER BY a.application_date DESC, a.id DESC';
        const [rows] = await db.query(sql, params);
        return rows.map((r) => ({ ...r, child_display_name: childDisplayName(r) }));
    }

    static async findById(id) {
        const [rows] = await db.query(
            `SELECT a.*,
                    c.first_name AS child_first_name,
                    c.middle_name AS child_middle_name,
                    c.last_name AS child_last_name,
                    c.name AS child_name,
                    c.child_public_id AS child_public_id,
                    c.date_of_birth AS child_date_of_birth,
                    c.gender AS child_gender,
                    c.status AS child_status
             FROM adoptions a
             INNER JOIN children c ON c.id = a.child_id
             WHERE a.id = ?`,
            [id]
        );
        const row = rows[0];
        if (!row) return null;
        return { ...row, child_display_name: childDisplayName(row) };
    }

    static async countCompletedForChild(childId, excludeAdoptionId = null) {
        let sql = `SELECT COUNT(*) AS n FROM adoptions WHERE child_id = ? AND adoption_status = 'Completed'`;
        const params = [childId];
        if (excludeAdoptionId) {
            sql += ' AND id <> ?';
            params.push(excludeAdoptionId);
        }
        const [rows] = await db.query(sql, params);
        return Number(rows[0].n) || 0;
    }

    static async create(body) {
        const d = mapBody(body);
        const cols = [
            'child_id',
            'adopter_full_name',
            'adopter_gender',
            'adopter_dob',
            'adopter_phone',
            'adopter_nationality',
            'adopter_phone_country_iso',
            'adopter_phone_country_code',
            'adopter_email',
            'adopter_address',
            'occupation',
            'marital_status',
            'number_of_children',
            'income_level',
            'house_type',
            'identification_type',
            'identification_number',
            'adoption_status',
            'application_date',
            'approval_date',
            'visit_scheduled_at',
            'assigned_staff',
            'notes'
        ];
        const placeholders = cols.map(() => '?').join(', ');
        const values = cols.map((c) => d[c]);
        const [result] = await db.query(`INSERT INTO adoptions (${cols.join(', ')}) VALUES (${placeholders})`, values);
        return result.insertId;
    }

    static async update(id, body) {
        const d = mapBody(body);
        const cols = [
            'child_id',
            'adopter_full_name',
            'adopter_gender',
            'adopter_dob',
            'adopter_phone',
            'adopter_nationality',
            'adopter_phone_country_iso',
            'adopter_phone_country_code',
            'adopter_email',
            'adopter_address',
            'occupation',
            'marital_status',
            'number_of_children',
            'income_level',
            'house_type',
            'identification_type',
            'identification_number',
            'adoption_status',
            'application_date',
            'approval_date',
            'visit_scheduled_at',
            'assigned_staff',
            'notes'
        ];
        const setSql = cols.map((c) => `${c} = ?`).join(', ');
        const values = cols.map((c) => d[c]);
        values.push(id);
        const [result] = await db.query(`UPDATE adoptions SET ${setSql} WHERE id = ?`, values);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM adoptions WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async getDashboardStats() {
        const [total] = await db.query('SELECT COUNT(*) AS n FROM adoptions');
        const [pending] = await db.query(`SELECT COUNT(*) AS n FROM adoptions WHERE adoption_status = 'Pending'`);
        const [accepted] = await db.query(`SELECT COUNT(*) AS n FROM adoptions WHERE adoption_status = 'Accepted'`);
        const [scheduled] = await db.query(`SELECT COUNT(*) AS n FROM adoptions WHERE adoption_status = 'Scheduled'`);
        return {
            total: total[0].n,
            pending: pending[0].n,
            accepted: accepted[0].n,
            scheduled: scheduled[0].n
        };
    }

    static async findRecent(limit = 5) {
        const [rows] = await db.query(
            `SELECT a.id, a.adopter_full_name, a.adoption_status, a.application_date,
                    c.first_name AS child_first_name, c.middle_name AS child_middle_name,
                    c.last_name AS child_last_name, c.name AS child_name
             FROM adoptions a
             INNER JOIN children c ON c.id = a.child_id
             ORDER BY a.application_date DESC, a.id DESC
             LIMIT ?`,
            [limit]
        );
        return rows.map((r) => ({ ...r, child_display_name: childDisplayName(r) }));
    }

    static async accept(id) {
        const [result] = await db.query(
            `UPDATE adoptions
             SET adoption_status = 'Accepted',
                 approval_date = COALESCE(approval_date, CURDATE())
             WHERE id = ? AND adoption_status = 'Pending'`,
            [id]
        );
        return result.affectedRows > 0;
    }

    static async scheduleVisit(id, visitDateTime, assignedStaff = null, notes = null) {
        const [result] = await db.query(
            `UPDATE adoptions
             SET adoption_status = 'Scheduled',
                 visit_scheduled_at = ?,
                 assigned_staff = COALESCE(?, assigned_staff),
                 notes = CASE
                     WHEN ? IS NULL OR TRIM(?) = '' THEN notes
                     WHEN notes IS NULL OR TRIM(notes) = '' THEN ?
                     ELSE CONCAT(notes, '\n', ?)
                 END
             WHERE id = ? AND adoption_status IN ('Accepted', 'Scheduled', 'Approved')`,
            [visitDateTime, assignedStaff, notes, notes, notes, notes, id]
        );
        if (result.affectedRows > 0) return true;
        const latest = await this.findById(id);
        if (!latest) return false;
        const savedVisit = latest.visit_scheduled_at ? String(latest.visit_scheduled_at).slice(0, 16) : '';
        const requestedVisit = String(visitDateTime || '').slice(0, 16);
        return latest.adoption_status === 'Scheduled' && savedVisit === requestedVisit;
    }

    // For public adoption application submissions
    static async createPublic(data) {
        const cols = [
            'child_id','adopter_full_name','adopter_gender','adopter_dob','adopter_phone',
            'adopter_nationality','adopter_email','adopter_address','occupation','marital_status',
            'number_of_children','income_level','house_type','identification_type','identification_number',
            'adoption_status','application_date','applicant_location','agreed_to_terms','notes'
        ];
        const values = cols.map(c => data[c] !== undefined ? data[c] : null);
        const placeholders = cols.map(() => '?').join(', ');
        const [result] = await db.query(`INSERT INTO adoptions (${cols.join(', ')}) VALUES (${placeholders})`, values);
        return result.insertId;
    }
}

module.exports = Adoption;
