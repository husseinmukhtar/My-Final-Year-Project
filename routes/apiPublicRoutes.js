const express = require('express');
const router = express.Router();

const publicController = require('../controllers/publicController');
const { uploadReportAttachment, uploadAdmissionDocument } = require('../middleware/uploadPublicFiles');

router.get('/requests', publicController.showRequests);
router.get('/report', publicController.showReportForm);
router.post('/report', uploadReportAttachment, publicController.submitReport);
router.get('/admission', publicController.showAdmissionForm);
router.post('/admission', uploadAdmissionDocument, publicController.submitAdmission);

module.exports = router;
