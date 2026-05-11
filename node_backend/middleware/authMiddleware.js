module.exports = {
    requireAuth: (req, res, next) => {
        if (req.session && req.session.userId) {
            return next();
        } else {
            return res.redirect('/login');
        }
    },
    requireAdmin: (req, res, next) => {
        if (!req.session || !req.session.userId) {
            return res.redirect('/login');
        }
        if (req.session.role !== 'admin') {
            req.flash('error', 'Access denied. Administrator privileges required.');
            return res.status(403).send('403 Forbidden');
        }
        return next();
    }
};
