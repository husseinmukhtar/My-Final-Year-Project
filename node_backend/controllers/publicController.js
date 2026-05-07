const Donation = require('../models/Donation');
const Adoption = require('../models/Adoption');
const db = require('../config/db');
const path = require('path');
const { sendDonationConfirmation, sendAdoptionConfirmation } = require('../utils/email');

function itemPhotoPath(file) {
    if (!file) return null;
    return `/uploads/donations/${path.basename(file.path)}`;
}

exports.showLanding = (req, res) => {
    res.render('public/landing', { success: false, error: null, paystackKey: process.env.PAYSTACK_PUBLIC_KEY || '' });
};

exports.showCheckout = (req, res) => {
    res.render('public/donation_checkout');
};

exports.submitDonation = async (req, res) => {
    try {
        const { donor_name, donor_email, donation_type, currency, payment_method,
                amount, item_description, paystack_reference } = req.body;
        const uploadedItemImagePath = itemPhotoPath(req.file);

        if (!donor_name || !donor_email || !donation_type) {
            return res.render('public/landing', { success: false, error: 'Please fill in all required fields.', paystackKey: process.env.PAYSTACK_PUBLIC_KEY || '' });
        }

        const donation_date = new Date().toISOString().split('T')[0];
        const reference = paystack_reference || `MANUAL-${Date.now()}`;

        const donationData = {
            donor_name: donor_name.trim(),
            donor_email: donor_email.trim(),
            donation_type,
            currency: currency || 'NGN',
            payment_method: paystack_reference ? 'Paystack' : (payment_method || null),
            amount: amount ? parseFloat(amount) : null,
            item_description: item_description || null,
            item_photo_path: uploadedItemImagePath,
            donation_date,
            reference,
            status: paystack_reference ? 'Completed' : 'Pending'
        };

        if (donation_type === 'Cash' && !paystack_reference) {
            if (!currency || !amount) {
                return res.render('public/landing', { success: false, error: 'Please provide currency and amount.', paystackKey: process.env.PAYSTACK_PUBLIC_KEY || '' });
            }
        }
        if (donation_type === 'Items' && !item_description) {
            return res.render('public/landing', { success: false, error: 'Please provide an item description.', paystackKey: process.env.PAYSTACK_PUBLIC_KEY || '' });
        }
        if (donation_type === 'Items') donationData.payment_method = null;

        const id = await Donation.create(donationData);

        // Send confirmation email to donor
        try { await sendDonationConfirmation({ ...donationData, id }); } catch(e) { console.error('Donation email failed:', e.message); }

        res.render('public/landing', { success: true, error: null, paystackKey: process.env.PAYSTACK_PUBLIC_KEY || '' });
    } catch (err) {
        console.error('Donation Error:', err);
        res.render('public/landing', { success: false, error: 'An internal server error occurred.', paystackKey: process.env.PAYSTACK_PUBLIC_KEY || '' });
    }
};

/* ── Public Adoption Application ── */
exports.showAdoptionForm = async (req, res) => {
    try {
        const [children] = await db.query(
            `SELECT id, COALESCE(NULLIF(TRIM(CONCAT_WS(' ',first_name,last_name)),''),name) AS display_name,
             gender, date_of_birth, child_public_id
             FROM children WHERE status='Active' AND (is_draft IS NULL OR is_draft=0) ORDER BY id DESC`
        );
        res.render('public/apply-adoption', { children, success: null, error: null });
    } catch(err) {
        console.error(err);
        res.render('public/apply-adoption', { children: [], success: null, error: 'Failed to load form.' });
    }
};

exports.submitAdoptionApplication = async (req, res) => {
    let children = [];
    try {
        [children] = await db.query(
            `SELECT id, COALESCE(NULLIF(TRIM(CONCAT_WS(' ',first_name,last_name)),''),name) AS display_name,
             gender, date_of_birth, child_public_id
             FROM children WHERE status='Active' AND (is_draft IS NULL OR is_draft=0) ORDER BY id DESC`
        );
    } catch(e) { children = []; }

    try {
        const {
            child_id, adopter_full_name, adopter_gender, adopter_dob, adopter_phone,
            adopter_nationality, adopter_email, adopter_address, occupation, marital_status,
            number_of_children, income_level, house_type, identification_type,
            identification_number, applicant_location, agreed_to_terms, notes
        } = req.body;

        if (!adopter_full_name || !adopter_email || !adopter_phone || !adopter_address || !identification_type || !identification_number) {
            return res.render('public/apply-adoption', { children, success: null, error: 'Please fill in all required fields.' });
        }
        if (!agreed_to_terms) {
            return res.render('public/apply-adoption', { children, success: null, error: 'You must agree to the Terms & Conditions to proceed.' });
        }
        if (!applicant_location || !applicant_location.trim()) {
            return res.render('public/apply-adoption', { children, success: null, error: 'Please provide your current location/address.' });
        }

        const application_date = new Date().toISOString().split('T')[0];
        const data = {
            child_id: child_id || null,
            adopter_full_name: adopter_full_name.trim(),
            adopter_gender: adopter_gender || null,
            adopter_dob: adopter_dob || null,
            adopter_phone: adopter_phone.trim(),
            adopter_nationality: adopter_nationality || null,
            adopter_email: adopter_email.trim(),
            adopter_address: adopter_address.trim(),
            occupation: occupation || null,
            marital_status: marital_status || null,
            number_of_children: parseInt(number_of_children || 0),
            income_level: income_level || null,
            house_type: house_type || null,
            identification_type,
            identification_number: identification_number.trim(),
            adoption_status: 'Pending',
            application_date,
            applicant_location: applicant_location.trim(),
            agreed_to_terms: 1,
            notes: notes || null
        };

        const id = await Adoption.createPublic(data);

        let child_display_name = 'Selected Child';
        if (child_id) {
            try {
                const [rows] = await db.query(
                    `SELECT COALESCE(NULLIF(TRIM(CONCAT_WS(' ',first_name,last_name)),''),name) AS display_name FROM children WHERE id=?`, [child_id]
                );
                if (rows[0]) child_display_name = rows[0].display_name;
            } catch(e) {}
        }

        try { await sendAdoptionConfirmation({ ...data, id, child_display_name }); } catch(e) { console.error('Adoption email failed:', e.message); }

        res.render('public/apply-adoption', {
            children,
            success: `Application submitted! Reference #${id}. A confirmation email has been sent to ${data.adopter_email}.`,
            error: null
        });
    } catch(err) {
        console.error('Adoption Submit Error:', err);
        res.render('public/apply-adoption', { children, success: null, error: 'An error occurred. Please try again.' });
    }
};
