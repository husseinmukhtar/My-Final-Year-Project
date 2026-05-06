const express = require('express');
const router = express.Router();
const admissionController = require('../controllers/admissionController');

const { admissionLimiter } = require('../middleware/rateLimiter');
const { uploadAdmissionSupportingDoc } = require('../middleware/uploadChildFiles');

router.get('/', admissionController.getPublicForm);
router.post('/', admissionLimiter, uploadAdmissionSupportingDoc, admissionController.createPublicAdoption);
router.get('/status', admissionController.getStatusLookup);
router.post('/status', admissionLimiter, admissionController.postStatusLookup);

module.exports = router;
