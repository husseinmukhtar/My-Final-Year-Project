const path = require('path');
const db = require('../config/db');

function photoPath(file) {
    if (!file) return null;
    return `/uploads/reports/${path.basename(file.path)}`;
}

exports.showChoice = async (req, res) => {
    try {
        res.render('public/child-report');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.showReportForm = async (req, res) => {
    try {
        res.render('public/report-child', { form: {}, error: null });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.submitReport = async (req, res) => {
    try {
        if (req.fileUploadError) {
            req.flash('error', req.fileUploadError);
            return res.render('public/report-child', { form: req.body, error: req.fileUploadError });
        }

        const reporterName = String(req.body.reporter_name || '').trim();
        const reporterPhone = String(req.body.reporter_phone || '').trim();
        const locationFound = String(req.body.location_found || '').trim();
        const childAge = String(req.body.child_age || '').trim();
        const childGender = String(req.body.child_gender || '').trim();
        const description = String(req.body.description || '').trim();

        if (!reporterName || !reporterPhone || !locationFound) {
            const msg = 'Reporter name, phone, and location found are required.';
            req.flash('error', msg);
            return res.render('public/report-child', { form: req.body, error: msg });
        }

        await db.query(
            `INSERT INTO reported_children
             (reporter_name, reporter_phone, location_found, child_age, child_gender, description, photo_path, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [reporterName, reporterPhone, locationFound, childAge || null, childGender || null, description || null, photoPath(req.file), 'Pending']
        );

        req.flash('success', 'Report submitted successfully. Our team will review it.');
        res.redirect('/public/report-child');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.adminIndex = async (req, res) => {
    try {
        const [reports] = await db.query('SELECT * FROM reported_children ORDER BY submitted_at DESC, id DESC');
        res.render('admin/reported-children', { reports });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const status = String(req.body.status || '').trim();
        const allowed = ['Pending', 'Reviewed', 'Admitted', 'Rejected'];
        if (!allowed.includes(status)) {
            req.flash('error', 'Invalid reported child status.');
            return res.redirect('/admin/reported-children');
        }

        await db.query('UPDATE reported_children SET status = ? WHERE id = ?', [status, req.params.id]);
        req.flash('success', 'Reported child status updated.');
        res.redirect('/admin/reported-children');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};
