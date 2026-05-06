const Adoption = require('../models/Adoption');

exports.index = async (req, res) => {
    try {
        const { search, success, error } = req.query;
        const adoptions = await Adoption.findAll(search);
        res.render('adoptions/index', { adoptions, search, success, error });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.new = (req, res) => {
    res.render('adoptions/new', { error: null });
};

exports.create = async (req, res) => {
    try {
        const { applicant_name, email, phone, address, child_name, status, request_date } = req.body;
        
        if (!applicant_name || !email || !phone || !address || !child_name || !status || !request_date) {
            return res.render('adoptions/new', { error: 'Please fill in all required fields.' });
        }
        
        await Adoption.create({ applicant_name, email, phone, address, child_name, status, request_date });
        res.redirect('/adoptions?success=Adoption request successfully added!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.edit = async (req, res) => {
    try {
        const adoption = await Adoption.findById(req.params.id);
        if (!adoption) return res.redirect('/adoptions?error=Request Not Found');

        res.render('adoptions/edit', { adoption, error: null });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.update = async (req, res) => {
    try {
        const { applicant_name, email, phone, address, child_name, status, request_date } = req.body;
        
        if (!applicant_name || !email || !phone || !address || !child_name || !status || !request_date) {
            const adoption = await Adoption.findById(req.params.id);
            if (!adoption) return res.redirect('/adoptions?error=Request Not Found');
            return res.render('adoptions/edit', { adoption, error: 'Please fill in all required fields.' });
        }

        await Adoption.update(req.params.id, { applicant_name, email, phone, address, child_name, status, request_date });
        res.redirect('/adoptions?success=Adoption request successfully updated!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error: ' + err.message);
    }
};

exports.delete = async (req, res) => {
    try {
        await Adoption.delete(req.params.id);
        res.redirect('/adoptions?success=Adoption request permanently deleted.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
