const { getSmtpConfigStatus, sendTestEmail } = require('../utils/email');
const PublicReport = require('../models/PublicReport');
const PublicAdmission = require('../models/PublicAdmission');

exports.getTestEmailPage = async (req, res) => {
    try {
        res.render('admin/test-email', {
            success: req.query.success ? String(req.query.success) : null,
            error: req.query.error ? String(req.query.error) : null,
            smtpStatus: getSmtpConfigStatus()
        });
    } catch (err) {
        console.error('Failed to render test email page:', err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.sendTestEmail = async (req, res) => {
    try {
        const smtpStatus = getSmtpConfigStatus();
        if (!smtpStatus.configured) {
            const msg = `SMTP is not configured. Missing: ${smtpStatus.missing.join(', ')}`;
            console.error('Test email skipped:', msg);
            req.flash('error', String(msg));
            return res.redirect(`/admin/test-email`);
        }

        const result = await sendTestEmail();
        if (result.skipped) {
            console.error('Test email skipped:', result.reason);
            req.flash('error', String(result.reason));
            return res.redirect(`/admin/test-email`);
        }

        console.log(`SMTP test email sent successfully to ${result.to}`);
        return res.redirect(
            `/admin/test-email?success=${encodeURIComponent(`Test email sent successfully to ${result.to}.`)}`
        );
    } catch (err) {
        console.error('Failed to send test email:', err);
        return res.redirect(
            `/admin/test-email?error=${encodeURIComponent(`Failed to send test email: ${err.message}`)}`
        );
    }
};

exports.getPublicReports = async (req, res) => {
    try {
        const { search = '', status = '' } = req.query;
        const reports = await PublicReport.findAll(search, status);
        res.render('admin/public-reports/index', { reports, search, statusFilter: status });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.getPublicReport = async (req, res) => {
    try {
        const report = await PublicReport.findById(req.params.id);
        if (!report) {
            req.flash('error', 'Public report not found.');
            return res.redirect('/admin/public-reports');
        }
        res.render('admin/public-reports/show', { report });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.updatePublicReport = async (req, res) => {
    try {
        await PublicReport.updateStatus(req.params.id, req.body.status, req.body.admin_notes);
        req.flash('success', 'Public report updated.');
        res.redirect(`/admin/public-reports/${req.params.id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.getPublicAdmissions = async (req, res) => {
    try {
        const { search = '', status = '' } = req.query;
        const admissions = await PublicAdmission.findAll(search, status);
        res.render('admin/public-admissions/index', { admissions, search, statusFilter: status });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.getPublicAdmission = async (req, res) => {
    try {
        const admission = await PublicAdmission.findById(req.params.id);
        if (!admission) {
            req.flash('error', 'Public admission request not found.');
            return res.redirect('/admin/public-admissions');
        }
        res.render('admin/public-admissions/show', { admission });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.updatePublicAdmission = async (req, res) => {
    try {
        await PublicAdmission.updateStatus(req.params.id, req.body.status, req.body.admin_notes);
        req.flash('success', 'Public admission request updated.');
        res.redirect(`/admin/public-admissions/${req.params.id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};
