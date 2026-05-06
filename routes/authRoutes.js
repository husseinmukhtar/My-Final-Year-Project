const express = require('express');
const router = express.Router();
const controller = require('../controllers/authController');

// ── Login ─────────────────────────────────────────────────────────────────────
router.get('/login', controller.showLogin);
router.post('/login', controller.login);

// ── Register (admin-only user creation) ──────────────────────────────────────
router.get('/register', controller.showRegister);
router.post('/register', controller.register);

// ── Logout ────────────────────────────────────────────────────────────────────
router.get('/logout', controller.logout);

module.exports = router;
