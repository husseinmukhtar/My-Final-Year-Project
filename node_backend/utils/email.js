const nodemailer = require('nodemailer');

const REQUIRED_SMTP_VARS = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'NOTIFY_EMAIL_TO'];

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

function getTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: String(process.env.SMTP_SECURE || 'false').toLowerCase() === 'true',
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
}

function formatDateTime(d) {
    if (!d) return 'N/A';
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt.toISOString().replace('T', ' ').slice(0, 16);
}

async function sendMail(to, subject, html, text) {
    const status = getSmtpConfigStatus();
    if (!status.configured) return { skipped: true, reason: `SMTP not configured. Missing: ${status.missing.join(', ')}` };
    const transporter = getTransporter();
    await transporter.sendMail({ from: status.from, to, subject, html, text });
    return { skipped: false };
}

async function sendTestEmail() {
    const status = getSmtpConfigStatus();
    if (!status.configured) return { skipped: true, reason: `SMTP not configured. Missing: ${status.missing.join(', ')}` };
    const result = await sendMail(status.to, 'Test Email — OMS', '<p>SMTP is working correctly.</p>', 'SMTP is working correctly.');
    return { ...result, to: status.to };
}

/* ── Adoption: Application Received ── */
async function sendAdoptionConfirmation(adoption) {
    const applicantEmail = adoption.adopter_email;
    if (!applicantEmail) return { skipped: true, reason: 'No applicant email provided.' };

    const refId = adoption.id || 'N/A';
    const childName = adoption.child_display_name || 'the child';
    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <div style="background:#4F46E5;padding:24px;color:#fff;">
        <h2 style="margin:0;">Adoption Application Received</h2>
        <p style="margin:4px 0 0;">Orphanage Management System</p>
      </div>
      <div style="padding:24px;">
        <p>Dear <strong>${adoption.adopter_full_name || 'Applicant'}</strong>,</p>
        <p>Thank you for submitting your adoption application for <strong>${childName}</strong>. Your application has been received and is currently under review.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;background:#f9fafb;font-weight:bold;width:40%;">Reference ID</td><td style="padding:8px;">#${refId}</td></tr>
          <tr><td style="padding:8px;background:#f9fafb;font-weight:bold;">Status</td><td style="padding:8px;color:#D97706;font-weight:bold;">Pending Review</td></tr>
          <tr><td style="padding:8px;background:#f9fafb;font-weight:bold;">Application Date</td><td style="padding:8px;">${formatDateTime(adoption.application_date || new Date())}</td></tr>
        </table>
        <div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:12px;border-radius:4px;margin:16px 0;">
          <strong>⚠ Important Notice</strong><br>
          By submitting this application, you have agreed to our Terms & Conditions. Failure to comply with the adoption process requirements, providing false information, or abandoning the process after approval may result in permanent disqualification and legal consequences.
        </div>
        <p>Our team will review your application and contact you within <strong>5–7 business days</strong>. Please ensure your contact details are up to date.</p>
        <p style="color:#6B7280;font-size:13px;">If you did not submit this application, please ignore this email or contact us immediately.</p>
      </div>
      <div style="background:#F9FAFB;padding:16px;text-align:center;color:#9CA3AF;font-size:12px;">
        © ${new Date().getFullYear()} Orphanage Management System. All rights reserved.
      </div>
    </div>`;

    return sendMail(applicantEmail, `Adoption Application Received — Ref #${refId}`, html);
}

/* ── Adoption: Status Update ── */
async function sendAdoptionStatusUpdate(adoption) {
    const applicantEmail = adoption.adopter_email;
    if (!applicantEmail) return { skipped: true, reason: 'No applicant email.' };

    const status = adoption.adoption_status;
    const refId = adoption.id || 'N/A';
    const childName = adoption.child_display_name || 'the child';

    const statusColors = { Accepted: '#059669', Rejected: '#DC2626', Scheduled: '#2563EB', Completed: '#7C3AED', Pending: '#D97706' };
    const color = statusColors[status] || '#374151';

    let extraMsg = '';
    if (status === 'Accepted') {
        extraMsg = `<p>🎉 Congratulations! Your application has been <strong>accepted</strong>. Our team will contact you shortly to schedule a visit.</p>`;
    } else if (status === 'Scheduled') {
        extraMsg = `
        <p>Your visit/interview has been <strong>scheduled</strong>.</p>
        <table style="width:100%;border-collapse:collapse;margin:12px 0;">
          <tr><td style="padding:8px;background:#f9fafb;font-weight:bold;width:40%;">Visit Date & Time</td><td style="padding:8px;">${formatDateTime(adoption.visit_scheduled_at)}</td></tr>
          <tr><td style="padding:8px;background:#f9fafb;font-weight:bold;">Location/Notes</td><td style="padding:8px;">${adoption.notes || 'To be communicated'}</td></tr>
        </table>
        <div style="background:#EFF6FF;border-left:4px solid #3B82F6;padding:12px;border-radius:4px;">
          <strong>Please arrive on time.</strong> Bring a valid government-issued ID and any required legal documents. Failure to attend without prior notice may result in your application being cancelled.
        </div>`;
    } else if (status === 'Rejected') {
        extraMsg = `
        <p>We regret to inform you that your application has been <strong>rejected</strong>.</p>
        ${adoption.rejection_reason ? `<p><strong>Reason:</strong> ${adoption.rejection_reason}</p>` : ''}
        <p>You may reapply after 6 months if circumstances change. For further clarification, please contact our office.</p>`;
    } else if (status === 'Completed') {
        extraMsg = `<p>🌟 The adoption process has been <strong>completed</strong>. Congratulations on your new family member!</p>`;
    }

    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <div style="background:${color};padding:24px;color:#fff;">
        <h2 style="margin:0;">Adoption Application Update</h2>
        <p style="margin:4px 0 0;">Status: ${status}</p>
      </div>
      <div style="padding:24px;">
        <p>Dear <strong>${adoption.adopter_full_name || 'Applicant'}</strong>,</p>
        <p>Your adoption application for <strong>${childName}</strong> (Ref #${refId}) has been updated.</p>
        ${extraMsg}
      </div>
      <div style="background:#F9FAFB;padding:16px;text-align:center;color:#9CA3AF;font-size:12px;">
        © ${new Date().getFullYear()} Orphanage Management System. All rights reserved.
      </div>
    </div>`;

    return sendMail(applicantEmail, `Adoption Application Update — ${status} (Ref #${refId})`, html);
}

/* ── Adoption Schedule Notification (admin copy) ── */
async function sendAdoptionScheduleNotification(adoption) {
    const status = getSmtpConfigStatus();
    if (!status.configured) return { skipped: true, reason: `SMTP not configured.` };
    const text = [
        'A visit/interview has been scheduled.',
        `Applicant: ${adoption.adopter_full_name || 'N/A'}`,
        `Email: ${adoption.adopter_email || 'N/A'}`,
        `Phone: ${adoption.adopter_phone || 'N/A'}`,
        `Child: ${adoption.child_display_name || 'N/A'}`,
        `Visit: ${formatDateTime(adoption.visit_scheduled_at)}`,
        `Location: ${adoption.notes || 'N/A'}`
    ].join('\n');
    return sendMail(status.to, `Adoption Visit Scheduled - #${adoption.id}`, `<pre>${text}</pre>`, text);
}

/* ── Donation Confirmation to donor ── */
async function sendDonationConfirmation(donation) {
    const donorEmail = donation.donor_email;
    if (!donorEmail) return { skipped: true, reason: 'No donor email.' };

    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <div style="background:#059669;padding:24px;color:#fff;">
        <h2 style="margin:0;">Thank You for Your Donation!</h2>
        <p style="margin:4px 0 0;">Orphanage Management System</p>
      </div>
      <div style="padding:24px;">
        <p>Dear <strong>${donation.donor_name || 'Donor'}</strong>,</p>
        <p>We have received your ${donation.donation_type === 'Item' ? 'item donation' : 'monetary donation'} and are truly grateful for your generosity.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;background:#f9fafb;font-weight:bold;width:40%;">Reference</td><td style="padding:8px;">${donation.reference || '#' + donation.id}</td></tr>
          <tr><td style="padding:8px;background:#f9fafb;font-weight:bold;">Type</td><td style="padding:8px;">${donation.donation_type}</td></tr>
          ${donation.amount ? `<tr><td style="padding:8px;background:#f9fafb;font-weight:bold;">Amount</td><td style="padding:8px;">${donation.currency || ''} ${donation.amount}</td></tr>` : ''}
          ${donation.item_name ? `<tr><td style="padding:8px;background:#f9fafb;font-weight:bold;">Item</td><td style="padding:8px;">${donation.item_name}</td></tr>` : ''}
        </table>
        <p>Your contribution directly supports the children in our care. God bless you! 🙏</p>
      </div>
      <div style="background:#F9FAFB;padding:16px;text-align:center;color:#9CA3AF;font-size:12px;">
        © ${new Date().getFullYear()} Orphanage Management System. All rights reserved.
      </div>
    </div>`;

    return sendMail(donorEmail, `Donation Confirmation — Thank You!`, html);
}

module.exports = {
    getSmtpConfigStatus,
    sendTestEmail,
    sendAdoptionConfirmation,
    sendAdoptionStatusUpdate,
    sendAdoptionScheduleNotification,
    sendDonationConfirmation
};
