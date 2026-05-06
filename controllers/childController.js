const path = require('path');
const Child = require('../models/Child');
const Adoption = require('../models/Adoption');

function webUploadPath(file) {
    if (!file) return null;
    return `/uploads/children/${path.basename(file.path)}`;
}

function digitsOnly(s) {
    return String(s || '').replace(/\D/g, '');
}

function isValidPhone(s) {
    const d = digitsOnly(s);
    return d.length >= 10 && d.length <= 15;
}

function validateFinalRegistration(body) {
    const errors = [];
    const req = (k) => (body[k] != null && String(body[k]).trim() !== '' ? String(body[k]).trim() : '');

    if (!req('first_name')) errors.push('First name is required.');
    if (!req('last_name')) errors.push('Last name is required.');
    if (!req('gender') || req('gender') === 'Unknown') errors.push('Gender is required (select Male or Female).');
    if (!req('date_of_birth')) errors.push('Date of birth is required.');
    if (!req('admission_date')) errors.push('Admission date is required.');
    if (!req('guardian_phone')) errors.push('Guardian phone number is required.');
    else if (!isValidPhone(req('guardian_phone'))) {
        errors.push('Enter a valid phone number (10–15 digits, optional + prefix).');
    }
    if (!req('guardian_address')) errors.push('Guardian address is required.');
    if (!req('relationship_to_child')) errors.push('Relationship to child is required.');
    if (!req('family_status')) errors.push('Family status is required.');
    if (!req('status')) errors.push('System status is required.');
    if (!req('admission_reason')) errors.push('Admission reason is required.');
    if (!req('legal_guardian_approval')) errors.push('Legal guardian approval is required (Yes or No).');

    const guardianLine = req('guardian_name') || req('father_name') || req('mother_name');
    if (!guardianLine) {
        errors.push('Provide at least one of: father’s name, mother’s name, or guardian name.');
    }

    if (req('disability') === 'Yes' && !req('disability_description')) {
        errors.push('Please describe the disability when Disability is set to Yes.');
    }

    return errors;
}

function mergeFilePaths(req, existing = {}) {
    const passportFile = req.files && req.files.passport_photo && req.files.passport_photo[0];
    const docFile = req.files && req.files.supporting_document && req.files.supporting_document[0];
    return {
        passport_photo_path: webUploadPath(passportFile) || existing.passport_photo_path || null,
        supporting_document_path: webUploadPath(docFile) || existing.supporting_document_path || null
    };
}

/**
 * Single entry point for rendering children/new. Never call res.render('children/new', ...) directly.
 * Ensures every local exists and is never `undefined` (EJS + with(locals) resolves missing keys as ReferenceError).
 */
function renderNew(req, res, opts = {}) {
    const merged = {
        error: null,
        draft: null,
        formRepublish: null,
        latestDraft: null,
        success: null,
        dormitories: Child.DORMITORIES,
        ...opts
    };
    ['error', 'draft', 'formRepublish', 'latestDraft', 'success'].forEach((key) => {
        if (merged[key] === undefined) merged[key] = null;
    });
    if (merged.dormitories === undefined || merged.dormitories === null) {
        merged.dormitories = Child.DORMITORIES;
    }
    return res.render('children/new', merged);
}

exports.dashboard = async (req, res) => {
    try {
        const [stats, recentChildren, adoptionStats] = await Promise.all([
            Child.getStats(),
            Child.getRecent(5),
            Adoption.getDashboardStats().catch(() => ({ total: 0, pending: 0, accepted: 0, scheduled: 0 }))
        ]);
        res.render('children/dashboard', { stats, recentChildren, adoptionStats, userSession: req.session });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.index = async (req, res) => {
    try {
        const { search, status, success, error } = req.query;
        const children = await Child.findAll(search, status);
        res.render('children/index', { children, search, statusFilter: status, success, error });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.new = async (req, res) => {
    try {
        const queryError = req.query.error ? String(req.query.error) : null;
        const querySuccess = req.query.success ? String(req.query.success) : null;
        let draft = null;
        if (req.query.draftId) {
            const row = await Child.findById(req.query.draftId);
            if (row && row.is_draft === 1 && row.created_by_user_id === req.session.userId) {
                draft = row;
            }
        }
        const latestDraft = await Child.findLatestDraftForUser(req.session.userId);
        return renderNew(req, res, {
            error: queryError,
            draft,
            formRepublish: null,
            latestDraft,
            success: querySuccess
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.saveDraft = async (req, res) => {
    try {
        if (req.fileUploadError) {
            const latestDraft = await Child.findLatestDraftForUser(req.session.userId);
            return renderNew(req, res, {
                error: req.fileUploadError,
                draft: null,
                formRepublish: req.body,
                latestDraft
            });
        }

        const existingId = req.body.existing_draft_id ? parseInt(req.body.existing_draft_id, 10) : null;
        let existing = null;
        if (existingId) {
            existing = await Child.findById(existingId);
            if (!existing || existing.is_draft !== 1 || existing.created_by_user_id !== req.session.userId) {
                const latestDraft = await Child.findLatestDraftForUser(req.session.userId);
                return renderNew(req, res, {
                    error: 'Invalid or expired draft.',
                    draft: null,
                    formRepublish: req.body,
                    latestDraft
                });
            }
        }

        const paths = mergeFilePaths(req, existing || {});

        if (existing) {
            await Child.update(existing.id, {
                body: req.body,
                isDraft: true,
                child_public_id: existing.child_public_id,
                passport_photo_path: paths.passport_photo_path,
                supporting_document_path: paths.supporting_document_path,
                created_by_user_id: req.session.userId
            });
            return res.redirect(`/children/new?draftId=${existing.id}&success=${encodeURIComponent('Draft saved. You can continue anytime.')}`);
        }

        const insertId = await Child.create({
            body: req.body,
            isDraft: true,
            child_public_id: null,
            passport_photo_path: paths.passport_photo_path,
            supporting_document_path: paths.supporting_document_path,
            created_by_user_id: req.session.userId
        });
        return res.redirect(`/children/new?draftId=${insertId}&success=${encodeURIComponent('Draft saved. You can continue anytime.')}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.create = async (req, res) => {
    try {
        if (req.fileUploadError) {
            const latestDraft = await Child.findLatestDraftForUser(req.session.userId);
            return renderNew(req, res, {
                error: req.fileUploadError,
                draft: null,
                formRepublish: req.body,
                latestDraft
            });
        }

        const errors = validateFinalRegistration(req.body);
        if (errors.length) {
            const latestDraft = await Child.findLatestDraftForUser(req.session.userId);
            return renderNew(req, res, {
                error: errors.join(' '),
                draft: null,
                formRepublish: req.body,
                latestDraft
            });
        }

        const existingDraftId = req.body.existing_draft_id ? parseInt(req.body.existing_draft_id, 10) : null;
        let existing = null;
        if (existingDraftId) {
            existing = await Child.findById(existingDraftId);
            if (!existing || existing.is_draft !== 1 || existing.created_by_user_id !== req.session.userId) {
                const latestDraft = await Child.findLatestDraftForUser(req.session.userId);
                return renderNew(req, res, {
                    error: 'Invalid draft. Please start again or open your latest draft from the banner.',
                    draft: null,
                    formRepublish: req.body,
                    latestDraft
                });
            }
        }

        const paths = mergeFilePaths(req, existing || {});
        const publicId = existing && existing.child_public_id
            ? existing.child_public_id
            : await Child.generateChildPublicId();

        if (existing) {
            await Child.update(existing.id, {
                body: req.body,
                isDraft: false,
                child_public_id: publicId,
                passport_photo_path: paths.passport_photo_path,
                supporting_document_path: paths.supporting_document_path,
                created_by_user_id: req.session.userId
            });
            req.flash('success', 'Child registered successfully.');
            return res.redirect(`/children`);
        }

        await Child.create({
            body: req.body,
            isDraft: false,
            child_public_id: publicId,
            passport_photo_path: paths.passport_photo_path,
            supporting_document_path: paths.supporting_document_path,
            created_by_user_id: req.session.userId
        });
        req.flash('success', 'Child registered successfully.');
            return res.redirect(`/children`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.edit = async (req, res) => {
    try {
        const child = await Child.findById(req.params.id);
        if (!child) req.flash('error', 'Child Not Found');
        return res.redirect('/children');
        if (child.is_draft === 1) {
            return res.redirect(`/children/new?draftId=${child.id}`);
        }

        res.render('children/edit', { child, error: null, dormitories: Child.DORMITORIES });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.update = async (req, res) => {
    try {
        if (req.fileUploadError) {
            const child = await Child.findById(req.params.id);
            if (!child) req.flash('error', 'Child Not Found');
        return res.redirect('/children');
            return res.render('children/edit', {
                child: { ...child, ...req.body },
                error: req.fileUploadError,
                dormitories: Child.DORMITORIES
            });
        }

        const errors = validateFinalRegistration(req.body);
        const child = await Child.findById(req.params.id);
        if (!child) req.flash('error', 'Child Not Found');
        return res.redirect('/children');
        if (child.is_draft === 1) {
            return res.redirect(`/children/new?draftId=${child.id}`);
        }

        if (errors.length) {
            return res.render('children/edit', {
                child: { ...child, ...req.body },
                error: errors.join(' '),
                dormitories: Child.DORMITORIES
            });
        }

        const paths = mergeFilePaths(req, child);
        await Child.update(req.params.id, {
            body: req.body,
            isDraft: false,
            child_public_id: child.child_public_id || (await Child.generateChildPublicId()),
            passport_photo_path: paths.passport_photo_path,
            supporting_document_path: paths.supporting_document_path,
            created_by_user_id: child.created_by_user_id || req.session.userId
        });

        req.flash('success', 'Child details successfully updated!');
        res.redirect('/children');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.delete = async (req, res) => {
    try {
        await Child.delete(req.params.id);
        req.flash('success', 'Child record permanently deleted.');
        res.redirect('/children');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
