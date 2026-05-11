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
            return res.status(403).render('403', { 
                user: { full_name: req.session.fullName, role: req.session.role } 
            });
        }
        return next();
    }
};
