const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 30001;

// Setup Session Middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'oms_node_super_secure_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 } // 1 day
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
    res.locals.user = req.session.userId ? { full_name: req.session.fullName, role: req.session.role } : null;
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
const { requireAuth } = require('./middleware/authMiddleware');

// Mount Auth
app.use('/', authRoutes);

// Mount protected modules (Order here is very important!)
app.use('/children', requireAuth, childrenRoutes);
app.use('/adoptions', requireAuth, adoptionRoutes);
app.use('/staff', requireAuth, staffRoutes);
app.use('/donations', requireAuth, donationRoutes);
app.use('/reports', requireAuth, reportRoutes);
app.use('/admin', requireAuth, adminRoutes);
app.get('/admin/reported-children', requireAuth, reportChildController.adminIndex);
app.post('/admin/reported-children/:id/status', requireAuth, reportChildController.updateStatus);

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

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
