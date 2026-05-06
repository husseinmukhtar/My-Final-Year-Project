const Donation = require('../models/Donation');

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

function mapDonationBody(body, existing = {}) {
    const donation_type = body.donation_type;
    const isItems = donation_type === 'Items';
    return {
        donor_name: body.donor_name ? String(body.donor_name).trim() : '',
        donor_email: body.donor_email ? String(body.donor_email).trim() : '',
        phone: body.phone ? String(body.phone).trim() : null,
        donation_type,
        currency: isItems ? null : (body.currency || 'USD'),
        payment_method: isItems ? null : (body.payment_method || null),
        amount: isItems ? null : (body.amount ? parseFloat(body.amount) : null),
        item_description: isItems ? String(body.item_description || '').trim() : null,
        item_category: isItems ? String(body.item_category || '').trim() || null : null,
        item_quantity: isItems ? String(body.item_quantity || '').trim() || null : null,
        item_condition: isItems ? String(body.item_condition || '').trim() || null : null,
        pickup_required: isItems && body.pickup_required === '1',
        pickup_address: isItems ? String(body.pickup_address || '').trim() || null : null,
        preferred_pickup_date: isItems ? String(body.preferred_pickup_date || '').trim() || null : null,
        item_photo_path: body.item_photo_path || existing.item_photo_path || null,
        message: body.message ? String(body.message).trim() : null,
        donation_date: body.donation_date
    };
}

function validateDonation(data) {
    const errors = [];
    if (!data.donor_name) errors.push('Donor name is required.');
    if (!data.donor_email) errors.push('Donor email is required.');
    if (!data.donation_type) errors.push('Donation type is required.');
    if (!data.donation_date) errors.push('Donation date is required.');
    if (data.donation_type === 'Cash') {
        if (!data.amount || data.amount <= 0) errors.push('Cash donations require a valid amount.');
        if (!data.payment_method) errors.push('Cash donations require a payment method.');
    }
    if (data.donation_type === 'Items') {
        if (!data.item_description) errors.push('Item donations require a description.');
        if (!data.item_quantity) errors.push('Item donations require a quantity.');
        if (data.pickup_required && !data.pickup_address) errors.push('Pickup address is required when pickup is requested.');
    }
    return errors;
}

exports.create = async (req, res) => {
    try {
        const data = mapDonationBody(req.body);
        const errors = validateDonation(data);
        if (errors.length) return res.render('donations/new', { error: errors.join(' ') });

        await Donation.create(data);
        req.flash('success', 'Donation record successfully added!');
        res.redirect('/donations');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.edit = async (req, res) => {
    try {
        const donation = await Donation.findById(req.params.id);
        if (!donation) {
            req.flash('error', 'Donation Not Found');
            return res.redirect('/donations');
        }

        res.render('donations/edit', { donation, error: null });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.update = async (req, res) => {
    try {
        const donationId = req.params.id;

        const donation = await Donation.findById(donationId);
        if (!donation) {
            req.flash('error', 'Donation Not Found');
            return res.redirect('/donations');
        }

        const data = mapDonationBody(req.body, donation);
        const errors = validateDonation(data);
        if (errors.length) return res.render('donations/edit', { donation: { ...donation, ...data }, error: errors.join(' ') });

        await Donation.update(donationId, data);
        req.flash('success', 'Donation record successfully updated!');
        res.redirect('/donations');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const allowed = ['pending', 'approved', 'rejected'];
        const status = String(req.body.status || '').trim();
        if (!allowed.includes(status)) {
            req.flash('error', 'Invalid donation status.');
            return res.redirect('/donations');
        }

        await Donation.updateStatusById(req.params.id, status);
        req.flash('success', 'Donation status updated.');
        res.redirect('/donations');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.delete = async (req, res) => {
    try {
        await Donation.delete(req.params.id);
        req.flash('success', 'Donation record permanently deleted.');
        res.redirect('/donations');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};
