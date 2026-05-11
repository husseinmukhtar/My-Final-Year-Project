const express = require('express');
const router  = express.Router();
const authController = require('../controllers/authController');
const { requireAdmin } = require('../middleware/authMiddleware');

router.get('/login',    authController.showLogin);
router.post('/login',   authController.login);
router.get('/logout',   authController.logout);

// Admin-only: view and submit the user-creation form
router.get('/register',  requireAdmin, authController.showRegister);
router.post('/register', requireAdmin, authController.register);

module.exports = router;
