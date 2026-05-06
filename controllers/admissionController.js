const Child = require('../models/Child');
const Adoption = require('../models/Adoption');
const { validateAdoptionBody, assertAdoptionBusinessRules, normalizePhoneForCountry, resolveCountry } = require('./adoptionController');

exports.getPublicForm = async (req, res) => {
    try {
        const children = await Child.findSelectableForAdoption(null);
        res.render('public/admission', {
            error: null,
            success: req.query.success === '1' ? 'Your adoption application has been submitted successfully.' : null,
            children,
            prefill: null
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.createPublicAdoption = async (req, res) => {
    try {
        // 1. Sanitize and override admin-controlled fields server-side
        // Force adoption_status 'Pending' and current application date
        const safeBody = {
            child_id: req.body.child_id,
            adopter_full_name: req.body.adopter_full_name,
            adopter_gender: req.body.adopter_gender,
            adopter_dob: req.body.adopter_dob,
            adopter_phone: req.body.adopter_phone,
            adopter_nationality: req.body.adopter_nationality,
            adopter_email: req.body.adopter_email,
            adopter_address: req.body.adopter_address,
            occupation: req.body.occupation,
            marital_status: req.body.marital_status,
            number_of_children: req.body.number_of_children,
            income_level: req.body.income_level,
            house_type: req.body.house_type,
            identification_type: req.body.identification_type,
            identification_number: req.body.identification_number,
            adoption_status: 'Pending',
            application_date: new Date().toISOString().slice(0, 10),
            approval_date: null,
            assigned_staff: null,
            notes: req.body.notes || ''
        };
        const phoneCheck = normalizePhoneForCountry(safeBody.adopter_phone, safeBody.adopter_nationality);
        const country = resolveCountry(safeBody.adopter_nationality);
        safeBody.adopter_phone = phoneCheck.normalized;
        safeBody.adopter_phone_country_iso = country ? country.iso : null;
        safeBody.adopter_phone_country_code = country ? country.code : null;

        // 2. Validate using existing logic
        const errors = validateAdoptionBody(safeBody);
        const biz = await assertAdoptionBusinessRules(safeBody, {});
        const all = errors.concat(biz);

        if (all.length) {
            const children = await Child.findSelectableForAdoption(null);
            return res.render('public/admission', {
                error: all.join(' '),
                success: null,
                children,
                prefill: safeBody
            });
        }

        // 3. Create record using sanitized data
        await Adoption.create(safeBody);

        // Redirect to same page with success flag
        req.flash('success', '1');
        res.redirect('/admission');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.getStatusLookup = (req, res) => {
    res.render('public/admission_status', { application: null, error: null, searched: false, query: { id: '', email: '' } });
};

exports.postStatusLookup = async (req, res) => {
    try {
        const id = parseInt(req.body.id, 10);
        const email = String(req.body.email || '').trim().toLowerCase();
        if (!Number.isFinite(id) || !email) {
            return res.render('public/admission_status', {
                application: null,
                error: 'Provide a valid application ID and email.',
                searched: true,
                query: { id: req.body.id || '', email: req.body.email || '' }
            });
        }
        const app = await Adoption.findById(id);
        if (!app || String(app.adopter_email || '').trim().toLowerCase() !== email) {
            return res.render('public/admission_status', {
                application: null,
                error: 'No matching adoption application found.',
                searched: true,
                query: { id: req.body.id || '', email: req.body.email || '' }
            });
        }
        res.render('public/admission_status', {
            application: app,
            error: null,
            searched: true,
            query: { id: req.body.id || '', email: req.body.email || '' }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};
