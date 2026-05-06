const db = require('../config/db');

class Report {
    static async getStats() {
        const [
            childrenResult,
            staffResult,
            donationsResult,
            adoptionsResult,
            amountResult,
            recentRequestsResult
        ] = await Promise.all([
            db.query('SELECT COUNT(*) AS total FROM children WHERE (is_draft IS NULL OR is_draft = 0)'),
            db.query('SELECT COUNT(*) AS total FROM staff'),
            db.query('SELECT COUNT(*) AS total FROM donations'),
            db.query('SELECT COUNT(*) AS total FROM adoptions'),
            db.query(`
                SELECT
                    COALESCE(SUM(CASE WHEN UPPER(currency) = 'USD' THEN amount ELSE 0 END), 0) AS total_usd_amount,
                    COALESCE(SUM(CASE WHEN UPPER(currency) = 'NGN' THEN amount ELSE 0 END), 0) AS total_ngn_amount
                FROM donations
            `),
            db.query(`
                SELECT a.adopter_full_name AS applicant_name,
                       COALESCE(NULLIF(TRIM(CONCAT_WS(' ', c.first_name, c.last_name)), ''), c.name) AS child_name,
                       a.adoption_status AS status,
                       a.application_date AS request_date
                FROM adoptions a
                INNER JOIN children c ON c.id = a.child_id
                ORDER BY a.application_date DESC, a.id DESC
                LIMIT 5
            `)
        ]);

        return {
            childrenCount: childrenResult[0][0].total,
            staffCount: staffResult[0][0].total,
            donationsCount: donationsResult[0][0].total,
            adoptionCount: adoptionsResult[0][0].total,
            totalDonationAmountUSD: amountResult[0][0].total_usd_amount || 0,
            totalDonationAmountNGN: amountResult[0][0].total_ngn_amount || 0,
            recentRequests: recentRequestsResult[0] || []
        };
    }

    static async exportDonations() {
        try {
            const [rows] = await db.query('SELECT donor_name, donor_email, donation_type, currency, amount, item_description, donation_date FROM donations ORDER BY id DESC');
            return rows || [];
        } catch (e) { return []; }
    }

    static async exportChildren() {
        try {
            const [rows] = await db.query(`
                SELECT child_public_id, name, first_name, last_name, date_of_birth, gender,
                       admission_date, status, guardian_phone, family_status, known_allergies,
                       medical_conditions, dormitory_room, created_at, updated_at
                FROM children
                WHERE (is_draft IS NULL OR is_draft = 0)
                ORDER BY id DESC
            `);
            return rows || [];
        } catch (e) { return []; }
    }

    static async exportAdoptions() {
        try {
            const [rows] = await db.query(`
                SELECT a.id,
                       a.child_id,
                       COALESCE(NULLIF(TRIM(CONCAT_WS(' ', c.first_name, c.middle_name, c.last_name)), ''), c.name) AS child_name,
                       c.child_public_id,
                       a.adopter_full_name,
                       a.adopter_gender,
                       a.adopter_dob,
                       a.adopter_email,
                       a.adopter_phone,
                       a.adopter_nationality,
                       a.adopter_phone_country_iso,
                       a.adopter_phone_country_code,
                       a.adopter_address,
                       a.occupation,
                       a.marital_status,
                       a.number_of_children,
                       a.income_level,
                       a.house_type,
                       a.identification_type,
                       a.identification_number,
                       a.adoption_status,
                       a.application_date,
                       a.approval_date,
                       a.visit_scheduled_at,
                       a.assigned_staff,
                       a.notes,
                       a.created_at,
                       a.updated_at
                FROM adoptions a
                INNER JOIN children c ON c.id = a.child_id
                ORDER BY a.id DESC
            `);
            return rows || [];
        } catch (e) {
            return [];
        }
    }

    static async getMonthlyDonations() {
        try {
            const [rows] = await db.query(`
                SELECT DATE_FORMAT(donation_date, '%Y-%m') as month, SUM(amount) as total 
                FROM donations 
                WHERE amount IS NOT NULL 
                GROUP BY month 
                ORDER BY month ASC
                LIMIT 12
            `);
            return rows || [];
        } catch (e) { return []; }
    }

    static async getChildrenByStatus() {
        try {
            const [rows] = await db.query(`
                SELECT status, COUNT(*) as count 
                FROM children 
                WHERE (is_draft IS NULL OR is_draft = 0)
                GROUP BY status
            `);
            return rows || [];
        } catch (e) { return []; }
    }
}

module.exports = Report;
