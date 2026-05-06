const { getSmtpConfigStatus, sendTestEmail } = require('../utils/email');

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
            return res.redirect(`/admin/test-email?error=${encodeURIComponent(msg)}`);
        }

        const result = await sendTestEmail();
        if (result.skipped) {
            console.error('Test email skipped:', result.reason);
            return res.redirect(`/admin/test-email?error=${encodeURIComponent(result.reason)}`);
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
