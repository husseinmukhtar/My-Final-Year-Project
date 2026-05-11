const bcrypt = require('bcryptjs');
const User = require('../models/User');

// A valid bcrypt hash is always exactly 60 chars: $2a$10$<22-char salt><31-char hash>
// Variants $2b$ and $2y$ (PHP) are also accepted.
const BCRYPT_HASH_RE = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

exports.showLogin = (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect(req.session.role === 'admin' ? '/admin-dashboard' : '/staff-dashboard');
    }
    res.render('auth/login', { error: null });
};

exports.showRegister = (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect(req.session.role === 'admin' ? '/admin-dashboard' : '/staff-dashboard');
    }
    res.render('auth/register', { error: null, success: null });
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.render('auth/login', { error: 'Please fill in all fields.' });
    }

    try {
        const user = await User.findByEmail(email);

        if (!user) {
            console.log('[AUTH] Login failed: no user found for email:', email);
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/login');
        }

        // Check for truncated hash
        if (!user.password || user.password.length < 50) {
            console.log('[AUTH] WARNING: Truncated or missing hash for user:', email, 
                        'Hash length:', user.password ? user.password.length : 0);
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/login');
        }

        // Log hash check before comparison
        console.log('[AUTH] Comparing password for:', email, 
                    'Hash starts with:', user.password.substring(0, 7),
                    'Hash length:', user.password.length);

        // Support PHP-originated $2y$ hashes — bcryptjs only understands $2a$/$2b$.
        const cleanHash = user.password.trim();
        const storedHash = cleanHash.replace(/^\$2y\$/, '$2a$');

        const isMatch = await bcrypt.compare(password, storedHash);

        if (!isMatch) {
            console.log('[AUTH] bcrypt.compare failed for:', email);
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/login');
        }

        req.session.userId = user.id;
        req.session.role = user.role;
        req.session.fullName = user.full_name;
        req.flash('success', 'Logged in successfully.');

        console.log('[AUTH] Login successful for:', email, 'Role:', user.role);

        if (user.role === 'admin') {
            return res.redirect('/admin-dashboard');
        } else {
            return res.redirect('/staff-dashboard');
        }
    } catch (err) {
        console.error('[auth] Login error:', err);
        return res.render('auth/login', { error: 'An internal server error occurred.' });
    }
};

exports.register = async (req, res) => {
    const { full_name, email, password, role } = req.body;

    if (!full_name || !email || !password) {
        return res.render('auth/register', {
            error: 'Full name, email, and password are required.',
            success: null
        });
    }

    try {
        const existing = await User.findByEmail(email);
        if (existing) {
            return res.render('auth/register', {
                error: `A user with email "${email}" already exists.`,
                success: null
            });
        }

        const allowedRoles = ['admin', 'staff'];
        const assignedRole = allowedRoles.includes(role) ? role : 'staff';

        await User.create({ full_name, email, password, role: assignedRole });

        console.log(`[auth] New user registered: ${email} (role: ${assignedRole}) by admin id=${req.session.userId}`);
        return res.render('auth/register', {
            error: null,
            success: `User "${full_name}" (${assignedRole}) created successfully.`
        });
    } catch (err) {
        console.error('[auth] Register error:', err);
        return res.render('auth/register', {
            error: 'An internal server error occurred.',
            success: null
        });
    }
};

exports.logout = (req, res) => {
    const uid = req.session && req.session.userId;
    req.session.destroy(err => {
        if (err) console.error(`[auth] Session destroy error for user id=${uid}:`, err);
        res.redirect('/');
    });
};
