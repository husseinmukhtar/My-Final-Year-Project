const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.showLogin = (req, res) => {
    // Already logged in? Redirect to protected area
    if (req.session && req.session.userId) {
        if (req.session.role === 'admin') {
            return res.redirect('/admin-dashboard');
        } else {
            return res.redirect('/staff-dashboard');
        }
    }
    res.render('auth/login', { error: null });
};

exports.showRegister = (req, res) => {
    if (req.session && req.session.userId) {
        if (req.session.role === 'admin') {
            return res.redirect('/admin-dashboard');
        } else {
            return res.redirect('/staff-dashboard');
        }
    }
    res.render('auth/register', { error: null });
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.render('auth/login', { error: 'Please fill in all fields.' });
    }

    try {
        const user = await User.findByEmail(email);
        if (user) {
            // Fix 1: Manually inserted hashes often contain hidden whitespace or newlines. Trim it.
            // Fix 2: If migrated from PHP, replace $2y$ which bcryptjs doesn't natively support with $2a$.
            const cleanHash = user.password.trim();
            const storedHash = cleanHash.replace(/^\$2y\$/, '$2a$');
            

            // Verify password using bcryptjs
            const passwordMatch = await bcrypt.compare(password, storedHash);
            
            if (passwordMatch) {
                // Initialize session values based on schema
                req.session.userId = user.id;
                req.session.fullName = user.full_name;
                req.session.role = user.role;
                req.flash('success', 'Logged in successfully.');
                if (user.role === 'admin') {
                    return res.redirect('/admin-dashboard');
                } else {
                    return res.redirect('/staff-dashboard');
                }
            } else {
                return res.render('auth/login', { error: 'Invalid password.' });
            }
        } else {
            return res.render('auth/login', { error: 'User not found.' });
        }
    } catch (err) {
        console.error(err);
        return res.render('auth/login', { error: 'An internal server error occurred.' });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) console.error('Logout err:', err);
        res.redirect('/');
    });
};
