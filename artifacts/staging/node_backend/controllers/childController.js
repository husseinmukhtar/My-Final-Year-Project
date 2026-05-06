const Child = require('../models/Child');

exports.dashboard = async (req, res) => {
    try {
        const stats = await Child.getStats();
        const recentChildren = await Child.getRecent(5);
        res.render('children/dashboard', { stats, recentChildren, userSession: req.session });
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

exports.new = (req, res) => {
    res.render('children/new', { error: null });
};

exports.create = async (req, res) => {
    try {
        const { name, age, gender, status } = req.body;
        
        if (!name || !age || !gender || !status) {
            return res.render('children/new', { error: 'Please fill in all required fields.' });
        }
        
        await Child.create({ name, age, gender, status });
        res.redirect('/children?success=Child successfully added!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.edit = async (req, res) => {
    try {
        const child = await Child.findById(req.params.id);
        if (!child) return res.redirect('/children?error=Child Not Found');

        res.render('children/edit', { child, error: null });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.update = async (req, res) => {
    try {
        const { name, age, gender, status } = req.body;
        
        if (!name || !age || !gender || !status) {
            const child = await Child.findById(req.params.id);
            if (!child) return res.redirect('/children?error=Child Not Found');
            return res.render('children/edit', { child, error: 'Please fill in all required fields.' });
        }

        await Child.update(req.params.id, { name, age, gender, status });
        res.redirect('/children?success=Child details successfully updated!');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};

exports.delete = async (req, res) => {
    try {
        await Child.delete(req.params.id);
        res.redirect('/children?success=Child record permanently deleted.');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
};
