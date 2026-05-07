const Adoption = require('../models/Adoption');
const Child = require('../models/Child');
const { sendAdoptionScheduleNotification, sendAdoptionStatusUpdate } = require('../utils/email');

const REQUIRED = [
    'child_id',
    'adopter_full_name',
    'adopter_gender',
    'adopter_phone',
    'adopter_email',
    'adopter_address',
    'marital_status',
    'identification_type',
    'identification_number',
    'adoption_status',
    'application_date'
];

const PHONE_COUNTRIES = {
    GH: { names: ['Ghana', 'Ghanaian'], code: '+233', nationalDigits: 9 },
    NG: { names: ['Nigeria', 'Nigerian'], code: '+234', nationalDigits: 10 },
    KE: { names: ['Kenya', 'Kenyan'], code: '+254', nationalDigits: 9 },
    US: { names: ['United States', 'American', 'USA'], code: '+1', nationalDigits: 10 },
    GB: { names: ['United Kingdom', 'British', 'UK'], code: '+44', nationalDigits: 10 }
};

function resolveCountry(input) {
    const raw = String(input || '').trim();
    if (!raw) return null;
    const upper = raw.toUpperCase();
    if (PHONE_COUNTRIES[upper]) return { iso: upper, ...PHONE_COUNTRIES[upper] };
    for (const [iso, cfg] of Object.entries(PHONE_COUNTRIES)) {
        if (cfg.names.some((n) => n.toUpperCase() === upper)) return { iso, ...cfg };
    }
    return null;
}

function normalizePhoneForCountry(phone, countryLike) {
    const country = resolveCountry(countryLike);
    const raw = String(phone || '').trim();
    if (!raw || !country) return { normalized: raw, error: null, country };
    const plusAndDigits = raw.replace(/[^\d+]/g, '');
    const startsWithPlus = plusAndDigits.startsWith('+');
    let digits = plusAndDigits.replace(/\D/g, '');
    const codeDigits = country.code.replace('+', '');
    if (startsWithPlus) {
        if (!digits.startsWith(codeDigits)) {
            return { normalized: raw, error: `Phone must use ${country.code} for ${country.names[0]}.`, country };
        }
        digits = digits.slice(codeDigits.length);
    } else if (digits.startsWith('0')) {
        digits = digits.replace(/^0+/, '');
    }
    if (country.nationalDigits && digits.length !== country.nationalDigits) {
        return {
            normalized: raw,
            error: `Phone number for ${country.names[0]} must have ${country.nationalDigits} national digits.`,
            country
        };
    }
    return { normalized: `${country.code}${digits}`, error: null, country };
}

function validateAdoptionBody(body) {
    const errors = [];
    for (const key of REQUIRED) {
        const v = body[key];
        if (v === undefined || v === null || String(v).trim() === '') {
            errors.push(`${key.replace(/_/g, ' ')} is required.`);
        }
    }
    const st = body.adoption_status;
    if (st && !Adoption.STATUSES.includes(st)) {
        errors.push('Invalid adoption status.');
    }
    const email = String(body.adopter_email || '').trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Invalid email address.');
    }
    const phoneCheck = normalizePhoneForCountry(body.adopter_phone, body.adopter_nationality);
    if (phoneCheck.error) errors.push(phoneCheck.error);
    return errors;
}

async function assertAdoptionBusinessRules(body, { excludeAdoptionId = null } = {}) {
    const errors = [];
    const childId = parseInt(body.child_id, 10);
    if (!Number.isFinite(childId)) {
        errors.push('Invalid child selection.');
        return errors;
    }

    const child = await Child.findById(childId);
    if (!child || child.is_draft === 1) {
        errors.push('Selected child is not available.');
        return errors;
    }

    if (child.status === 'Adopted' && !excludeAdoptionId) {
        errors.push('This child is already marked as Adopted.');
    }

    const completed = await Adoption.countCompletedForChild(childId, excludeAdoptionId);
    if (completed >= 1 && body.adoption_status === 'Completed') {
        errors.push('This child already has a completed adoption. Only one completed adoption is allowed per child.');
    }

    return errors;
}

exports.validateAdoptionBody = validateAdoptionBody;
exports.assertAdoptionBusinessRules = assertAdoptionBusinessRules;
exports.normalizePhoneForCountry = normalizePhoneForCountry;
exports.resolveCountry = resolveCountry;

async function applyStatusSideEffects(childId, adoptionStatus, prevStatus) {
    if (adoptionStatus === 'Completed') {
        await Child.setStatus(childId, 'Adopted');
    } else if (prevStatus === 'Completed' && adoptionStatus !== 'Completed') {
        await Child.setStatus(childId, 'Available');
    }
}

exports.getAllAdoptions = async (req, res) => {
    try {
        const { search, status, success, error } = req.query;
        const adoptions = await Adoption.findAll(search || '', status || '');
        res.render('adoptions/index', {
            adoptions: adoptions || [],
            search: search || '',
            statusFilter: status || '',
            success: success ? String(success) : null,
            error: error ? String(error) : null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

// Admin endpoints for updating and deleting adoptions (removed create logic per requirements)
exports.getAdoptionById = async (req, res) => {
    try {
        const adoption = await Adoption.findById(req.params.id);
        if (!adoption) return res.redirect('/adoptions?error=Record not found');
        const success = req.query.success ? String(req.query.success) : null;
        const error = req.query.error ? String(req.query.error) : null;
        res.render('adoptions/show', { adoption, success: success || null, error: error || null });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.getEditForm = async (req, res) => {
    try {
        const adoption = await Adoption.findById(req.params.id);
        if (!adoption) return res.redirect('/adoptions?error=Record not found');
        const children = await Child.findSelectableForAdoption(req.params.id);
        res.render('adoptions/edit', { adoption, children, error: null });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.updateAdoption = async (req, res) => {
    try {
        const existing = await Adoption.findById(req.params.id);
        if (!existing) return res.redirect('/adoptions?error=Record not found');

        const errors = validateAdoptionBody(req.body);
        const biz = await assertAdoptionBusinessRules(req.body, { excludeAdoptionId: req.params.id });
        const all = errors.concat(biz);
        if (all.length) {
            const children = await Child.findSelectableForAdoption(req.params.id);
            return res.render('adoptions/edit', {
                adoption: { ...existing, ...req.body },
                children,
                error: all.join(' ')
            });
        }

        let body = { ...req.body };
        const phoneCheck = normalizePhoneForCountry(body.adopter_phone, body.adopter_nationality);
        body = {
            ...body,
            adopter_phone: phoneCheck.normalized,
            adopter_phone_country_iso: phoneCheck.country ? phoneCheck.country.iso : null,
            adopter_phone_country_code: phoneCheck.country ? phoneCheck.country.code : null
        };
        if (body.adoption_status === 'Accepted' && !String(body.approval_date || '').trim()) {
            body = { ...body, approval_date: new Date().toISOString().slice(0, 10) };
        }
        if (body.adoption_status !== 'Scheduled' && String(body.visit_scheduled_at || '').trim()) {
            body = { ...body, visit_scheduled_at: null };
        }
        if (body.adoption_status === 'Completed' && !String(body.approval_date || '').trim()) {
            body = { ...body, approval_date: new Date().toISOString().slice(0, 10) };
        }

        await Adoption.update(req.params.id, body);
        
        const newChildId = parseInt(body.child_id, 10);
        if (existing.child_id !== newChildId) {
            if (existing.adoption_status === 'Completed') {
                const remaining = await Adoption.countCompletedForChild(existing.child_id, req.params.id);
                if (remaining === 0) await Child.setStatus(existing.child_id, 'Available');
            }
            await applyStatusSideEffects(newChildId, body.adoption_status, null);
        } else {
            await applyStatusSideEffects(newChildId, body.adoption_status, existing.adoption_status);
        }

        // Send status email if status changed
        const newStatus = body.adoption_status;
        if (newStatus !== existing.adoption_status && ['Rejected','Completed'].includes(newStatus)) {
            try {
                const updatedRecord = await Adoption.findById(req.params.id);
                await sendAdoptionStatusUpdate(updatedRecord).catch(() => {});
            } catch(e) { console.error('Status email failed:', e.message); }
        }
        res.redirect(`/adoptions/${req.params.id}?success=${encodeURIComponent('Adoption record updated.')}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.acceptAdoption = async (req, res) => {
    try {
        const existing = await Adoption.findById(req.params.id);
        if (!existing) return res.redirect('/adoptions?error=Record not found');
        if (existing.adoption_status !== 'Pending') {
            return res.redirect(`/adoptions/${req.params.id}?error=${encodeURIComponent('Only pending applications can be accepted.')}`);
        }
        await Adoption.accept(req.params.id);
        // Send email to applicant
        try {
            const updated = await Adoption.findById(req.params.id);
            await sendAdoptionStatusUpdate({ ...updated, adoption_status: 'Accepted' });
        } catch(e) { console.error('Accept email failed:', e.message); }
        res.redirect(`/adoptions/${req.params.id}?success=${encodeURIComponent('Application accepted. Email sent to applicant.')}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.scheduleAdoptionVisit = async (req, res) => {
    try {
        const existing = await Adoption.findById(req.params.id);
        if (!existing) return res.redirect('/adoptions?error=Record not found');
        if (!['Accepted', 'Scheduled', 'Approved'].includes(existing.adoption_status)) {
            return res.redirect(`/adoptions/${req.params.id}?error=${encodeURIComponent('Only accepted applications can be scheduled.')}`);
        }
        const rawWhen = String(req.body.visit_scheduled_at || '').trim();
        if (!rawWhen) {
            return res.redirect(`/adoptions/${req.params.id}?error=${encodeURIComponent('Visit date and time is required.')}`);
        }
        const parsed = new Date(rawWhen);
        if (Number.isNaN(parsed.getTime())) {
            return res.redirect(`/adoptions/${req.params.id}?error=${encodeURIComponent('Invalid visit date and time.')}`);
        }
        const mysqlDateTime = parsed.toISOString().slice(0, 19).replace('T', ' ');
        const scheduleNotes = String(req.body.schedule_notes || '').trim() || null;
        const scheduled = await Adoption.scheduleVisit(
            req.params.id,
            mysqlDateTime,
            req.body.assigned_staff || null,
            scheduleNotes
        );
        if (!scheduled) {
            return res.redirect(`/adoptions/${req.params.id}?error=${encodeURIComponent('Could not save schedule. Please refresh and try again.')}`);
        }

        const updated = await Adoption.findById(req.params.id);
        try {
            // Email admin
            await sendAdoptionScheduleNotification(updated).catch(() => {});
            // Email applicant
            await sendAdoptionStatusUpdate({ ...updated, adoption_status: 'Scheduled' }).catch(() => {});
            return res.redirect(`/adoptions/${req.params.id}?success=${encodeURIComponent('Visit scheduled. Emails sent to applicant and admin.')}`);
        } catch (mailErr) {
            console.error('Schedule email failed:', mailErr);
            return res.redirect(`/adoptions/${req.params.id}?success=${encodeURIComponent('Visit scheduled successfully.')}`);
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.deleteAdoption = async (req, res) => {
    try {
        const existing = await Adoption.findById(req.params.id);
        if (!existing) return res.redirect('/adoptions?error=Record not found');

        await Adoption.delete(req.params.id);
        if (existing.adoption_status === 'Completed') {
            const remaining = await Adoption.countCompletedForChild(existing.child_id, null);
            if (remaining === 0) {
                await Child.setStatus(existing.child_id, 'Available');
            }
        }
        res.redirect('/adoptions?success=' + encodeURIComponent('Adoption record deleted.'));
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};
