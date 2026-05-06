const Donation = require('../models/Donation');
const path = require('path');

function itemPhotoPath(file) {
    if (!file) return null;
    return `/uploads/donations/${path.basename(file.path)}`;
}

exports.showLanding = (req, res) => {
    res.render('public/landing', { success: false, error: null });
};

exports.showCheckout = (req, res) => {
    res.render('public/donation_checkout');
};

exports.submitDonation = async (req, res) => {
    try {
        const { donor_name, donor_email, donation_type, currency, payment_method, amount, item_description } = req.body;
        const uploadedItemImagePath = itemPhotoPath(req.file);

        // Backend validation
        if (!donor_name || !donor_email || !donation_type) {
            return res.render('public/landing', { success: false, error: 'Please fill in all required fields.' });
        }

        // Setup date as today
        const donation_date = new Date().toISOString().split('T')[0];

        const donationData = {
            donor_name: donor_name.trim(),
            donor_email: donor_email.trim(),
            donation_type,
            currency: currency || null,
            payment_method: payment_method || null,
            amount: amount ? parseFloat(amount) : null,
            item_description: item_description || null,
            item_photo_path: uploadedItemImagePath,
            donation_date
        };

        if (donation_type === 'Cash') {
            if (!currency || !amount) {
                return res.render('public/landing', { success: false, error: 'Please provide currency and amount for cash donations.' });
            }
            if (!payment_method) {
                return res.render('public/landing', { success: false, error: 'Please provide a payment method for cash donations.' });
            }
        }
        if (donation_type === 'Items' && !item_description) {
            return res.render('public/landing', { success: false, error: 'Please provide an item description for item donations.' });
        }
        
        if (donation_type === 'Items') {
            donationData.payment_method = null;
        }

        // Save to Database
        await Donation.create(donationData);

        // Success - trigger SweetAlert using local variable
        res.render('public/landing', { success: true, error: null });

    } catch (err) {
        console.error("Donation Error:", err);
        res.render('public/landing', { success: false, error: 'An internal server error occurred while processing your donation.' });
    }
};
