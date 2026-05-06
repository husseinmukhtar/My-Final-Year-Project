const express = require('express');
const bodyParser = require('body-parser');
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

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json()); // For parsing application/json
app.use(express.static(path.join(__dirname, 'public')));

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
const { requireAuth } = require('./middleware/authMiddleware');

// Mount Auth
app.use('/', authRoutes);

// Mount protected modules (Order here is very important!)
app.use('/children', requireAuth, childrenRoutes);
app.use('/adoptions', requireAuth, adoptionRoutes);
app.use('/staff', requireAuth, staffRoutes);
app.use('/donations', requireAuth, donationRoutes);
app.use('/reports', requireAuth, reportRoutes);

const publicRoutes = require('./routes/public');
const apiDonationsRoutes = require('./routes/apiDonations');

// Mount Public Routes
app.use('/', publicRoutes);
app.use('/api/donations', apiDonationsRoutes);

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
