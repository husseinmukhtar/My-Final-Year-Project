const express = require('express');
const router = express.Router();

const reportChildController = require('../controllers/reportChildController');
const { publicFormLimiter } = require('../middleware/rateLimiter');
const { uploadReportedChildPhoto } = require('../middleware/uploadChildFiles');

router.get('/', reportChildController.showReportForm);
router.post('/', publicFormLimiter, uploadReportedChildPhoto, reportChildController.submitReport);

module.exports = router;
