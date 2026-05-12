const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 30001;

// Trust Vercel proxy (required for secure cookies on HTTPS)
app.set('trust proxy', true);

// MySQL Session Store
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'orphanage_management_system',
    clearExpired: true,
    checkExpirationInterval: 900000,
    expiration: 86400000,
    createDatabaseTable: true
});

// Setup Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'oms_node_super_secure_secret',
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// Setup EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
if (process.env.NODE_ENV !== 'production') {
    app.set('view cache', false);
}

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(express.json()); // For parsing application/json
app.use(express.static(path.join(__dirname, 'public')));

// Lightweight flash messages backed by the existing session store.
app.use((req, res, next) => {
    req.flash = (type, message) => {
        if (!req.session.flash) req.session.flash = {};
        if (message === undefined) {
            const value = req.session.flash[type];
            delete req.session.flash[type];
            return value;
        }
        req.session.flash[type] = message;
        return message;
    };
    res.locals.success = req.flash('success') || null;
    res.locals.error = req.flash('error') || null;
    next();
});

// Set global variable for EJS templates (so we can check user state in Navbars if needed)
app.use((req, res, next) => {
    res.locals.user = req.session.userId ? {
        id: req.session.userId,
        full_name: req.session.fullName,
        role: req.session.role
    } : null;
    next();
});

// Import Routes and Middleware
const authRoutes = require('./routes/auth');
const childrenRoutes = require('./routes/children');
const adoptionRoutes = require('./routes/adoptions');
const staffRoutes = require('./routes/staff');
const donationRoutes = require('./routes/donations');
const reportRoutes = require('./routes/reports');
const adminRoutes = require('./routes/admin');
const reportChildRoutes = require('./routes/reportChild');
const reportChildController = require('./controllers/reportChildController');
const { requireAuth, requireAdmin } = require('./middleware/authMiddleware');

// Mount Auth
app.use('/', authRoutes);

// Mount protected modules (Order here is very important!)
app.use('/children', requireAuth, childrenRoutes);
app.use('/adoptions', requireAuth, adoptionRoutes);
app.use('/staff', requireAdmin, staffRoutes);
app.use('/donations', requireAuth, donationRoutes);
app.use('/reports', requireAuth, reportRoutes);
app.use('/admin', requireAdmin, adminRoutes);
app.get('/admin/reported-children', requireAdmin, reportChildController.adminIndex);
app.post('/admin/reported-children/:id/status', requireAdmin, reportChildController.updateStatus);
app.get('/admin/reports', requireAdmin, reportChildController.adminIndex);
app.post('/admin/reports/:id/status', requireAdmin, reportChildController.updateStatus);
app.get('/admin/admissions', requireAdmin, (req, res) => res.redirect('/adoptions'));

const publicRoutes = require('./routes/public');
const apiDonationsRoutes = require('./routes/apiDonations');
const apiTestEmailRoutes = require('./routes/apiTestEmail');
const admissionRoutes = require('./routes/admission');

// Mount Public Routes
app.use('/', publicRoutes);
app.get('/public/child-report', reportChildController.showChoice);
app.use('/public/report-child', reportChildRoutes);
app.use('/admission', admissionRoutes);
app.use('/public/admission', admissionRoutes);
app.use('/api/donations', apiDonationsRoutes);
app.use('/api', apiTestEmailRoutes);

app.get('/admin-dashboard', requireAdmin, async (req, res) => {
    const Report = require('./models/Report');
    const stats = await Report.getStats().catch(() => ({}));
    res.render('dashboard/admin', {
        user: { full_name: req.session.fullName, role: req.session.role },
        stats
    });
});

app.get('/staff-dashboard', requireAuth, async (req, res) => {
    if (req.session.role === 'admin') {
        return res.redirect('/admin-dashboard');
    }
    const Report = require('./models/Report');
    const stats = await Report.getStats().catch(() => ({}));
    res.render('dashboard/staff', {
        user: { full_name: req.session.fullName, role: req.session.role },
        stats
    });
});



// Start Server (local dev only)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

// Export for Vercel serverless
module.exports = app;
