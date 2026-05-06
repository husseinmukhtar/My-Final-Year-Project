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
            db.query('SELECT COUNT(*) AS total FROM children'),
            db.query('SELECT COUNT(*) AS total FROM staff'),
            db.query('SELECT COUNT(*) AS total FROM donations'),
            db.query('SELECT COUNT(*) AS total FROM adoption_requests'),
            db.query('SELECT SUM(amount) AS total_amount FROM donations'),
            db.query('SELECT applicant_name, child_name, status, request_date FROM adoption_requests ORDER BY id DESC LIMIT 5')
        ]);

        return {
            childrenCount: childrenResult[0][0].total,
            staffCount: staffResult[0][0].total,
            donationsCount: donationsResult[0][0].total,
            adoptionCount: adoptionsResult[0][0].total,
            totalDonationAmount: amountResult[0][0].total_amount || 0,
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
            const [rows] = await db.query('SELECT full_name, dob, gender, admission_date, status, medical_history FROM children ORDER BY id DESC');
            return rows || [];
        } catch (e) { return []; }
    }

    static async exportAdoptions() {
        try {
            const [rows] = await db.query('SELECT child_name, applicant_name, applicant_email, applicant_phone, status, request_date FROM adoption_requests ORDER BY id DESC');
            return rows || [];
        } catch (e) { return []; }
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
                GROUP BY status
            `);
            return rows || [];
        } catch (e) { return []; }
    }
}

module.exports = Report;
