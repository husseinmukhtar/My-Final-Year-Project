const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.showLogin = (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/children');
    }
    res.render('auth/login', { csrfToken: req.csrfToken ? req.csrfToken() : '' });
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        req.flash('error', 'Please fill in all fields.');
        return res.redirect('/login');
    }

    try {
        const user = await User.findByEmail(email);
        if (user) {
            const cleanHash = user.password.trim();
            const storedHash = cleanHash.replace(/^\$2y\$/, '$2a$');
            
            const passwordMatch = await bcrypt.compare(password, storedHash);
            
            if (passwordMatch) {
                req.session.userId = user.id;
                req.session.fullName = user.full_name;
                req.session.role = user.role;
                
                req.flash('success', 'Logged in successfully.');
                return res.redirect('/children');
            }
        }
        
        req.flash('error', 'Invalid email or password.');
        return res.redirect('/login');
    } catch (err) {
        console.error(err);
        req.flash('error', 'An internal server error occurred.');
        return res.redirect('/login');
    }
};

exports.showRegister = (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/children');
    }
    res.render('auth/register', { csrfToken: req.csrfToken ? req.csrfToken() : '' });
};

exports.register = async (req, res) => {
    const { full_name, email, password, role } = req.body;

    if (!full_name || !email || !password) {
        req.flash('error', 'Please fill in all required fields.');
        return res.redirect('/register');
    }

    try {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            req.flash('error', 'Email already in use.');
            return res.redirect('/register');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({ full_name, email, password: hashedPassword, role: role || 'staff' });
        
        req.flash('success', 'Registration successful. Please log in.');
        return res.redirect('/login');
    } catch (err) {
        console.error(err);
        req.flash('error', 'An internal server error occurred during registration.');
        return res.redirect('/register');
    }
};

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Logout err:', err);
        }
        res.redirect('/login');
    });
};
