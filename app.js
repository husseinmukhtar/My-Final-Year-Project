const express = require('express');
const methodOverride = require('method-override');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const flash = require('connect-flash');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Trust Vercel's proxy (required for secure cookies on HTTPS)
app.set('trust proxy', 1);

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
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// Setup EJS & Layouts
app.use(expressLayouts);
app.set('layout', 'layouts/main');
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
if (process.env.NODE_ENV !== 'production') {
    app.set('view cache', false);
}

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(express.json()); // For parsing application/json
app.use(express.static(path.join(__dirname, 'public')));

// Setup Flash Messages & Global Variables
app.use(flash());
app.use((req, res, next) => {
    res.locals.success = req.flash('success');
    res.locals.error   = req.flash('error');
    res.locals.user    = req.session.userId ? { full_name: req.session.fullName, role: req.session.role } : null;
    next();
});

// Import Routes and Middleware
const authRoutes = require('./routes/authRoutes');
const childrenRoutes = require('./routes/childrenRoutes');
const adoptionRoutes = require('./routes/adoptionsRoutes');
const staffRoutes = require('./routes/staffRoutes');
const donationRoutes = require('./routes/donationsRoutes');
const reportRoutes = require('./routes/reportsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const apiPublicRoutes = require('./routes/apiPublicRoutes');
const apiDonationsRoutes = require('./routes/apiDonationsRoutes');
const admissionRoutes = require('./routes/admissionRoutes');
const { requireAuth } = require('./middleware/authMiddleware');

// Mount Auth
app.use('/', authRoutes);

// Mount protected modules
app.use('/children', requireAuth, childrenRoutes);
app.use('/adoptions', requireAuth, adoptionRoutes);
app.use('/staff', requireAuth, staffRoutes);
app.use('/donations', requireAuth, donationRoutes);
app.use('/reports', requireAuth, reportRoutes);
app.use('/admin', requireAuth, adminRoutes);

// Mount Public Routes
app.use('/', publicRoutes);
app.use('/public', apiPublicRoutes);
app.use('/admission', admissionRoutes);
app.use('/api/donations', apiDonationsRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).render('404');
});

// 500 handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('500');
});

// Start Server (local dev only)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}

// Export for Vercel serverless
module.exports = app;
