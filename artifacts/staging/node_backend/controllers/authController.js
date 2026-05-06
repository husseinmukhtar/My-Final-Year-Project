const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.showLogin = (req, res) => {
    // Already logged in? Redirect to protected area
    if (req.session && req.session.userId) {
        return res.redirect('/children');
    }
    res.render('auth/login', { error: null });
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
            
            // Temporary debug logs
            console.log('--- DEBUG LOGIN FLOW ---');
            console.log('1. User input password length:', password.length);
            console.log('2. User input password:', `[${password}]`);
            console.log('3. Stored DB hash raw length:', user.password.length);
            console.log('4. Stored DB hash after trim:', `[${cleanHash}]`);
            console.log('5. Target hash for comparison:', `[${storedHash}]`);
            console.log('--- END DEBUG ---');

            // Verify password using bcryptjs
            const passwordMatch = await bcrypt.compare(password, storedHash);
            console.log('6. Comparison result:', passwordMatch);
            
            if (passwordMatch) {
                // Initialize session values based on schema
                req.session.userId = user.id;
                req.session.fullName = user.full_name;
                req.session.role = user.role;
                
                return res.redirect('/children');
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
        if (err) {
            console.error('Logout err:', err);
        }
        res.redirect('/login');
    });
};
