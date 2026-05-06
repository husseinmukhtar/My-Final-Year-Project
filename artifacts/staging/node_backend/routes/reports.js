const router = require('express').Router();
const reportController = require('../controllers/reportController');

// GET /reports - Show dashboard stats
router.get('/', reportController.index);

router.get('/export/donations', reportController.exportDonations);
router.get('/export/children', reportController.exportChildren);
router.get('/export/adoptions', reportController.exportAdoptions);

module.exports = router;
