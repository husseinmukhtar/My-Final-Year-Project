const express = require('express');
const router = express.Router();


const adminController = require('../controllers/adminController');

router.get('/test-email', adminController.getTestEmailPage);
router.post('/test-email', adminController.sendTestEmail);

router.get('/public-reports', adminController.getPublicReports);
router.get('/public-reports/:id', adminController.getPublicReport);
router.post('/public-reports/:id', adminController.updatePublicReport);

router.get('/public-admissions', adminController.getPublicAdmissions);
router.get('/public-admissions/:id', adminController.getPublicAdmission);
router.post('/public-admissions/:id', adminController.updatePublicAdmission);


module.exports = router;
