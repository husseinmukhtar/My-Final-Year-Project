const Donation = require('../models/Donation');
const path = require('path');

function itemPhotoPath(file) {
    if (!file) return null;
    return `/uploads/donations/${path.basename(file.path)}`;
}

exports.index = async (req, res) => {
    try {
        const { search, success, error } = req.query;
        const donations = await Donation.findAll(search);
        res.render('donations/index', { donations, search, success, error });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.new = (req, res) => {
    res.render('donations/new', { error: null });
};

exports.create = async (req, res) => {
    try {
        if (req.session.role !== 'admin') {
            req.flash('error', 'Access denied. Only administrators can record donations.');
            return res.redirect('/donations');
        }
        let {
            donor_name, donor_email, phone, donation_type, currency, payment_method, amount,
            item_description, item_name, quantity, item_condition, donation_date
        } = req.body;
        
        if (!donor_name || !donor_email || !donation_type || !donation_date) {
            return res.render('donations/new', { error: 'Please fill in all strictly required fields.' });
        }
        
        // Backend validation enforcing type relations
        if (donation_type === 'Cash') {
            if (!amount || amount <= 0) {
                return res.render('donations/new', { error: 'Cash donations require a valid amount.' });
            }
            if (!payment_method) {
                return res.render('donations/new', { error: 'Cash donations require a payment method.' });
            }
        }
        if (donation_type === 'Items') {
            if (!item_name || !quantity) {
                return res.render('donations/new', { error: 'Item donations require item name and quantity.' });
            }
            if (!donor_name) {
                return res.render('donations/new', { error: 'Item donations require a donor name.' });
            }
        }
        
        // Clean unused fields based on type
        if (donation_type === 'Cash') item_description = '';
        if (donation_type === 'Items') {
            amount = null;
            payment_method = null;
            currency = null;
        }

        await Donation.create({
            donor_name,
            donor_email,
            phone,
            donation_type,
            currency,
            payment_method,
            amount,
            item_description,
            item_name,
            quantity: quantity ? parseInt(quantity, 10) : null,
            item_condition,
            item_photo_path: itemPhotoPath(req.file),
            donation_date
        });
        res.redirect('/donations?success=Donation record successfully added!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.edit = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation) return res.redirect('/donations?error=Donation Not Found');

        res.render('donations/edit', { donation, error: null });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.update = async (req, res) => {
    try {
        let {
            donor_name, donor_email, phone, donation_type, currency, payment_method, amount,
            item_description, item_name, quantity, item_condition, donation_date
        } = req.body;
        const donationId = req.params.id;

        const donation = await Donation.findById(donationId);
        if (!donation) return res.redirect('/donations?error=Donation Not Found');

        if (!donor_name || !donor_email || !donation_type || !donation_date) {
            return res.render('donations/edit', { donation, error: 'Please fill in all strictly required fields.' });
        }

        if (donation_type === 'Cash') {
            if (!amount || amount <= 0) {
                return res.render('donations/edit', { donation, error: 'Cash donations require a valid amount.' });
            }
            if (!payment_method) {
                return res.render('donations/edit', { donation, error: 'Cash donations require a payment method.' });
            }
        }
        if (donation_type === 'Items') {
            if (!item_name || !quantity) {
                return res.render('donations/edit', { donation, error: 'Item donations require item name and quantity.' });
            }
            if (!donor_name) {
                return res.render('donations/edit', { donation, error: 'Item donations require a donor name.' });
            }
        }
        
        if (donation_type === 'Cash') item_description = '';
        if (donation_type === 'Items') {
            amount = null;
            payment_method = null;
            currency = null;
        }

        await Donation.update(donationId, {
            donor_name,
            donor_email,
            phone,
            donation_type,
            currency,
            payment_method,
            amount,
            item_description,
            item_name,
            quantity: quantity ? parseInt(quantity, 10) : null,
            item_condition,
            item_photo_path: itemPhotoPath(req.file),
            donation_date
        });
        res.redirect('/donations?success=Donation record successfully updated!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.delete = async (req, res) => {
    try {
        await Donation.delete(req.params.id);
        res.redirect('/donations?success=Donation record permanently deleted.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};
