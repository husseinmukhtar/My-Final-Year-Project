const Staff = require('../models/Staff');

exports.index = async (req, res) => {
    try {
        const { search, success, error } = req.query;
        const staffList = await Staff.findAll(search);
        res.render('staff/index', { staffList, search, success, error });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.new = (req, res) => {
    res.render('staff/new', { error: null });
};

exports.create = async (req, res) => {
    try {
        const { full_name, email, phone, role, address, date_joined } = req.body;
        
        if (!full_name || !email || !phone || !role || !date_joined) {
            return res.render('staff/new', { error: 'Please fill in all required fields.' });
        }
        
        const emailExists = await Staff.findByEmailExcludingId(email);
        if (emailExists) {
            return res.render('staff/new', { error: 'Staff email already exists.' });
        }

        await Staff.create({ full_name, email, phone, role, address, date_joined });
        req.flash('success', 'Staff record successfully added!');
        res.redirect('/staff');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.edit = async (req, res) => {
    try {
        const staff = await Staff.findById(req.params.id);
        if (!staff) req.flash('error', 'Staff Not Found');
        return req.flash('success', 'Staff record successfully updated!');
        res.redirect('/staff');

        res.render('staff/edit', { staff, error: null });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.update = async (req, res) => {
    try {
        const { full_name, email, phone, role, address, date_joined } = req.body;
        const staffId = req.params.id;

        const staff = await Staff.findById(staffId);
        if (!staff) req.flash('error', 'Staff Not Found');
        return res.redirect('/staff');

        if (!full_name || !email || !phone || !role || !date_joined) {
            return res.render('staff/edit', { staff, error: 'Please fill in all required fields.' });
        }

        const emailExists = await Staff.findByEmailExcludingId(email, staffId);
        if (emailExists) {
            return res.render('staff/edit', { staff, error: 'Staff email already exists.' });
        }

        await Staff.update(staffId, { full_name, email, phone, role, address, date_joined });
        res.redirect('/staff');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.delete = async (req, res) => {
    try {
        await Staff.delete(req.params.id);
        req.flash('success', 'Staff record permanently deleted.');
        res.redirect('/staff');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};
