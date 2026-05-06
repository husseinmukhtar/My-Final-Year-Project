const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/test-email', adminController.getTestEmailPage);
router.post('/test-email', adminController.sendTestEmail);

module.exports = router;
