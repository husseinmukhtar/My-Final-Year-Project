const nodemailer = require('nodemailer');

const REQUIRED_SMTP_VARS = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'NOTIFY_EMAIL_TO'
];

function getSmtpConfigStatus() {
    const missing = REQUIRED_SMTP_VARS.filter((key) => !String(process.env[key] || '').trim());
    return {
        configured: missing.length === 0,
        missing,
        host: process.env.SMTP_HOST || '',
        port: process.env.SMTP_PORT || '',
        secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
        from: process.env.SMTP_FROM || process.env.SMTP_USER || '',
        to: process.env.NOTIFY_EMAIL_TO || ''
    };
}

function smtpConfigured() {
    return getSmtpConfigStatus().configured;
}

function getTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });
}

function formatDateTime(d) {
    if (!d) return 'N/A';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt.toISOString().replace('T', ' ').slice(0, 16);
}

async function sendTestEmail() {
    const status = getSmtpConfigStatus();
    if (!status.configured) {
        return {
            skipped: true,
            reason: `SMTP/email env vars are not fully configured. Missing: ${status.missing.join(', ')}`
        };
    }

    const transporter = getTransporter();
    await transporter.sendMail({
        from: status.from,
        to: status.to,
        subject: 'SMTP Test Successful',
        text: 'This is a test email from the orphanage system.'
    });

    return { skipped: false, to: status.to };
}

async function sendAdoptionScheduleNotification(adoption) {
    const status = getSmtpConfigStatus();
    if (!status.configured) {
        return {
            skipped: true,
            reason: `SMTP/email env vars are not fully configured. Missing: ${status.missing.join(', ')}`
        };
    }
    const transporter = getTransporter();
    const to = status.to;
    const from = status.from;
    const subject = `Adoption Visit Scheduled - #${adoption.id}`;
    const text = [
        'A visit/interview has been scheduled.',
        '',
        `Applicant name: ${adoption.adopter_full_name || 'N/A'}`,
        `Applicant email: ${adoption.adopter_email || 'N/A'}`,
        `Applicant phone: ${adoption.adopter_phone || 'N/A'}`,
        `Child selected: ${adoption.child_display_name || 'N/A'} (${adoption.child_public_id || 'N/A'})`,
        `Scheduled visit date/time: ${formatDateTime(adoption.visit_scheduled_at)}`,
        `Assigned staff: ${adoption.assigned_staff || 'N/A'}`,
        `Admin notes/location: ${adoption.notes || 'N/A'}`
    ].join('\n');

    await transporter.sendMail({ from, to, subject, text });
    return { skipped: false };
}

module.exports = {
    getSmtpConfigStatus,
    sendTestEmail,
    sendAdoptionScheduleNotification
};
