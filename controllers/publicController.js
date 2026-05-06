const PublicReport = require('../models/PublicReport');
const PublicAdmission = require('../models/PublicAdmission');
const { webUploadPath } = require('../middleware/uploadPublicFiles');

exports.showHome = (req, res) => {
    res.render('home');
};

exports.showAbout = (req, res) => {
    res.render('about');
};

exports.showContact = (req, res) => {
    res.render('contact');
};

exports.showDonate = (req, res) => {
    res.render('public/donate', { successMessage: null, errorMessage: null, prefill: {} });
};

exports.showRequests = (req, res) => {
    res.render('public/requests');
};

exports.showReportForm = (req, res) => {
    res.render('public/report', { successMessage: null, errorMessage: null, prefill: {} });
};

exports.submitReport = async (req, res) => {
    try {
        if (req.fileUploadError) {
            return res.render('public/report', { successMessage: null, errorMessage: req.fileUploadError, prefill: req.body });
        }
        const required = ['reporter_name', 'reporter_phone', 'location', 'child_age_estimate', 'child_gender', 'description'];
        const missing = required.filter((k) => !String(req.body[k] || '').trim());
        if (missing.length) {
            return res.render('public/report', {
                successMessage: null,
                errorMessage: 'Please complete all required child report fields.',
                prefill: req.body
            });
        }
        const id = await PublicReport.create({
            ...req.body,
            report_type: 'Abandoned Child',
            subject: 'Abandoned child report',
            attachment_path: webUploadPath(req.file)
        });
        return res.render('public/report', {
            successMessage: `Thank you. The child report was submitted with reference #${id}. Status: Pending.`,
            errorMessage: null,
            prefill: {}
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.showAdmissionForm = (req, res) => {
    res.render('public/admission', { successMessage: null, errorMessage: null, prefill: {} });
};

exports.submitAdmission = async (req, res) => {
    try {
        if (req.fileUploadError) {
            return res.render('public/admission', { successMessage: null, errorMessage: req.fileUploadError, prefill: req.body });
        }
        const required = [
            'guardian_name',
            'guardian_phone',
            'relationship_to_child',
            'child_name',
            'child_age',
            'child_gender',
            'admission_reason'
        ];
        const missing = required.filter((k) => !String(req.body[k] || '').trim());
        if (missing.length) {
            return res.render('public/admission', {
                successMessage: null,
                errorMessage: 'Please complete all required admission fields.',
                prefill: req.body
            });
        }
        const id = await PublicAdmission.create({
            ...req.body,
            supporting_document_path: webUploadPath(req.file)
        });
        return res.render('public/admission', {
            successMessage: `Admission request submitted successfully with reference #${id}. Status: Pending.`,
            errorMessage: null,
            prefill: {}
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};
