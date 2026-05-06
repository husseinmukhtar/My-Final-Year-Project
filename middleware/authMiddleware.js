module.exports = {
    requireAuth: (req, res, next) => {
        if (req.session && req.session.userId) {
            return next();
        } else {
            return res.redirect('/login');
        }
    },
    requireAdmin: (req, res, next) => {
        if (req.session && req.session.userId && req.session.role === 'admin') {
            return next();
        }
        return res.status(403).render('403', {
            message: 'Access denied. Admin privileges required.'
        });
    }
};
