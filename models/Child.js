const db = require('../config/db');

const DORMITORIES = [
    'Unassigned',
    'Block A — Room 1',
    'Block A — Room 2',
    'Block A — Room 3',
    'Block B — Room 1',
    'Block B — Room 2',
    'Block B — Room 3',
    'Girls Dorm — East Wing',
    'Boys Dorm — West Wing',
    'Infant Care Unit'
];

function buildDisplayName(first, middle, last) {
    return [first, middle, last]
        .map((s) => (s || '').trim())
        .filter(Boolean)
        .join(' ')
        .trim();
}

function ageFromDob(dob) {
    if (!dob) return null;
    const birth = new Date(dob);
    if (Number.isNaN(birth.getTime())) return null;
    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) years -= 1;
    return Math.max(0, years);
}

class Child {
    static get DORMITORIES() {
        return DORMITORIES;
    }

    static draftClause() {
        return '(c.is_draft IS NULL OR c.is_draft = 0)';
    }

    static async findAll(search = '', statusFilter = '') {
        let query = `SELECT c.*, u.full_name AS created_by_name FROM children c LEFT JOIN users u ON u.id = c.created_by_user_id WHERE ${Child.draftClause()}`;
        const params = [];

        if (search) {
            query += ` AND (
                c.name LIKE ? OR c.first_name LIKE ? OR c.last_name LIKE ? OR c.child_public_id LIKE ?
            )`;
            const like = `%${search}%`;
            params.push(like, like, like, like);
        }

        if (statusFilter) {
            query += ' AND c.status = ?';
            params.push(statusFilter);
        }

        query += ' ORDER BY c.id DESC';
        const [rows] = await db.query(query, params);
        return rows;
    }

    static async getStats() {
        const base = `FROM children c WHERE ${Child.draftClause()}`;
        const [total] = await db.query(`SELECT COUNT(*) as count ${base}`);
        const [active] = await db.query(
            `SELECT COUNT(*) as count ${base} AND c.status IN ("Available", "Pending", "Processing")`
        );
        const [adopted] = await db.query(`SELECT COUNT(*) as count ${base} AND c.status = "Adopted"`);

        return {
            total: total[0].count,
            active: active[0].count,
            adopted: adopted[0].count
        };
    }

    static async getRecent(limit = 5) {
        const [rows] = await db.query(
            `SELECT c.*, u.full_name AS created_by_name FROM children c LEFT JOIN users u ON u.id = c.created_by_user_id WHERE ${Child.draftClause()} ORDER BY c.id DESC LIMIT ?`,
            [limit]
        );
        return rows;
    }

    static async findById(id) {
        const [rows] = await db.query(
            `SELECT c.*, u.full_name AS created_by_name
             FROM children c
             LEFT JOIN users u ON u.id = c.created_by_user_id
             WHERE c.id = ?`,
            [id]
        );
        return rows[0];
    }

    static async findLatestDraftForUser(userId) {
        if (!userId) return null;
        const [rows] = await db.query(
            `SELECT * FROM children WHERE is_draft = 1 AND created_by_user_id = ? ORDER BY updated_at DESC, id DESC LIMIT 1`,
            [userId]
        );
        return rows[0] || null;
    }

    static async generateChildPublicId(conn = null) {
        const year = new Date().getFullYear();
        const prefix = `CH-${year}-`;
        const runner = conn || db;
        const [rows] = await runner.query(
            `SELECT MAX(CAST(SUBSTRING_INDEX(child_public_id, '-', -1) AS UNSIGNED)) AS seq
             FROM children WHERE child_public_id LIKE ?`,
            [`${prefix}%`]
        );
        const maxSeq = rows[0] && rows[0].seq != null ? Number(rows[0].seq) : 0;
        const next = maxSeq + 1;
        return `${prefix}${String(next).padStart(3, '0')}`;
    }

    static mapBodyToRow(body, opts = {}) {
        const empty = (v) => (v === undefined || v === null || String(v).trim() === '' ? null : String(v).trim());
        const emptyText = (v) => (v === undefined || v === null ? null : String(v));

        const first_name = empty(body.first_name);
        const middle_name = empty(body.middle_name);
        const last_name = empty(body.last_name);
        const display =
            buildDisplayName(first_name, middle_name, last_name) ||
            (body.name && String(body.name).trim()) ||
            (opts.isDraft ? 'Draft registration' : 'Unnamed');

        const dob = empty(body.date_of_birth);
        const computedAge = ageFromDob(dob);
        const parsedManualAge =
            body.age != null && String(body.age).trim() !== '' ? parseInt(body.age, 10) : null;
        const ageValue =
            computedAge != null
                ? computedAge
                : Number.isFinite(parsedManualAge)
                  ? parsedManualAge
                  : opts.isDraft
                    ? 0
                    : 0;

        return {
            name: display,
            first_name,
            middle_name,
            last_name,
            date_of_birth: dob,
            age: ageValue,
            gender: empty(body.gender) || (opts.isDraft ? 'Unknown' : null),
            place_of_birth: empty(body.place_of_birth),
            nationality: empty(body.nationality),
            state_of_origin: empty(body.state_of_origin),
            admission_date: empty(body.admission_date),
            registration_number: empty(body.registration_number),
            father_name: empty(body.father_name),
            mother_name: empty(body.mother_name),
            guardian_name: empty(body.guardian_name),
            guardian_phone: empty(body.guardian_phone),
            guardian_address: emptyText(body.guardian_address),
            relationship_to_child: empty(body.relationship_to_child),
            family_status: empty(body.family_status),
            blood_group: empty(body.blood_group),
            genotype: empty(body.genotype),
            known_allergies: emptyText(body.known_allergies),
            medical_conditions: emptyText(body.medical_conditions),
            disability: empty(body.disability) || 'No',
            disability_description: emptyText(body.disability_description),
            last_medical_checkup: empty(body.last_medical_checkup),
            hospital_or_doctor: empty(body.hospital_or_doctor),
            vaccination_status: empty(body.vaccination_status),
            current_school: empty(body.current_school),
            class_grade: empty(body.class_grade),
            enrollment_status: empty(body.enrollment_status),
            academic_level: empty(body.academic_level),
            special_learning_needs: emptyText(body.special_learning_needs),
            dormitory_room: empty(body.dormitory_room),
            bed_number: empty(body.bed_number),
            date_assigned_accommodation: empty(body.date_assigned_accommodation),
            caregiver_assigned: empty(body.caregiver_assigned),
            admission_reason: emptyText(body.admission_reason),
            case_file_number: empty(body.case_file_number),
            legal_guardian_approval: empty(body.legal_guardian_approval),
            behavior_notes: emptyText(body.behavior_notes),
            special_needs_notes: emptyText(body.special_needs_notes),
            staff_remarks: emptyText(body.staff_remarks),
            status: empty(body.status) || (opts.isDraft ? 'Pending' : 'Available'),
            is_draft: opts.isDraft ? 1 : 0,
            child_public_id: opts.child_public_id !== undefined ? opts.child_public_id : null,
            passport_photo_path: opts.passport_photo_path,
            supporting_document_path: opts.supporting_document_path,
            created_by_user_id: opts.created_by_user_id != null ? opts.created_by_user_id : null
        };
    }

    static async create(data) {
        const row = Child.mapBodyToRow(data.body || data, {
            isDraft: data.isDraft,
            child_public_id: data.child_public_id,
            passport_photo_path: data.passport_photo_path,
            supporting_document_path: data.supporting_document_path,
            created_by_user_id: data.created_by_user_id
        });

        const cols = [
            'name',
            'age',
            'gender',
            'status',
            'child_public_id',
            'first_name',
            'middle_name',
            'last_name',
            'date_of_birth',
            'place_of_birth',
            'nationality',
            'state_of_origin',
            'admission_date',
            'registration_number',
            'passport_photo_path',
            'father_name',
            'mother_name',
            'guardian_name',
            'guardian_phone',
            'guardian_address',
            'relationship_to_child',
            'family_status',
            'blood_group',
            'genotype',
            'known_allergies',
            'medical_conditions',
            'disability',
            'disability_description',
            'last_medical_checkup',
            'hospital_or_doctor',
            'vaccination_status',
            'current_school',
            'class_grade',
            'enrollment_status',
            'academic_level',
            'special_learning_needs',
            'dormitory_room',
            'bed_number',
            'date_assigned_accommodation',
            'caregiver_assigned',
            'admission_reason',
            'case_file_number',
            'legal_guardian_approval',
            'supporting_document_path',
            'behavior_notes',
            'special_needs_notes',
            'staff_remarks',
            'is_draft',
            'created_by_user_id'
        ];

        const placeholders = cols.map(() => '?').join(', ');
        const values = cols.map((c) => row[c]);
        const sql = `INSERT INTO children (${cols.join(', ')}) VALUES (${placeholders})`;
        const [result] = await db.query(sql, values);
        return result.insertId;
    }

    static async update(id, data) {
        const row = Child.mapBodyToRow(data.body || data, {
            isDraft: data.isDraft,
            child_public_id: data.child_public_id,
            passport_photo_path: data.passport_photo_path,
            supporting_document_path: data.supporting_document_path,
            created_by_user_id: data.created_by_user_id
        });

        const cols = [
            'name',
            'age',
            'gender',
            'status',
            'child_public_id',
            'first_name',
            'middle_name',
            'last_name',
            'date_of_birth',
            'place_of_birth',
            'nationality',
            'state_of_origin',
            'admission_date',
            'registration_number',
            'passport_photo_path',
            'father_name',
            'mother_name',
            'guardian_name',
            'guardian_phone',
            'guardian_address',
            'relationship_to_child',
            'family_status',
            'blood_group',
            'genotype',
            'known_allergies',
            'medical_conditions',
            'disability',
            'disability_description',
            'last_medical_checkup',
            'hospital_or_doctor',
            'vaccination_status',
            'current_school',
            'class_grade',
            'enrollment_status',
            'academic_level',
            'special_learning_needs',
            'dormitory_room',
            'bed_number',
            'date_assigned_accommodation',
            'caregiver_assigned',
            'admission_reason',
            'case_file_number',
            'legal_guardian_approval',
            'supporting_document_path',
            'behavior_notes',
            'special_needs_notes',
            'staff_remarks',
            'is_draft'
        ];

        const setSql = cols.map((c) => `${c} = ?`).join(', ');
        const values = cols.map((c) => row[c]);
        values.push(id);

        const sql = `UPDATE children SET ${setSql} WHERE id = ?`;
        const [result] = await db.query(sql, values);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.query('DELETE FROM children WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async setStatus(id, status) {
        const [result] = await db.query('UPDATE children SET status = ? WHERE id = ?', [status, id]);
        return result.affectedRows > 0;
    }

    /**
     * Children eligible for adoption intake: non-draft, not Adopted, no Completed adoption row.
     * When editing an existing adoption, pass its id so the current child stays in the list.
     */
    static async findSelectableForAdoption(existingAdoptionId = null) {
        let currentChildId = null;
        if (existingAdoptionId) {
            const [ar] = await db.query('SELECT child_id FROM adoptions WHERE id = ?', [existingAdoptionId]);
            if (ar[0]) currentChildId = ar[0].child_id;
        }

        const [rows] = await db.query(
            `SELECT c.*, u.full_name AS created_by_name
             FROM children c
             LEFT JOIN users u ON u.id = c.created_by_user_id
             WHERE (c.is_draft IS NULL OR c.is_draft = 0)
               AND (
                 (c.status <> 'Adopted'
                  AND NOT EXISTS (
                    SELECT 1 FROM adoptions a
                    WHERE a.child_id = c.id AND a.adoption_status = 'Completed'
                  ))
                 OR (? IS NOT NULL AND c.id = ?)
               )
             ORDER BY COALESCE(NULLIF(TRIM(c.first_name), ''), c.name), c.id DESC`,
            [currentChildId, currentChildId]
        );
        return rows;
    }
}

module.exports = Child;
