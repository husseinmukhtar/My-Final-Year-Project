const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAdmin } = require('../middleware/authMiddleware');

// Show the login form
router.get('/login', authController.showLogin);

// Process the login submission
router.post('/login', authController.login);

// Process logout
router.get('/logout', authController.logout);
router.get('/register', requireAdmin, authController.showRegister);

module.exports = router;
