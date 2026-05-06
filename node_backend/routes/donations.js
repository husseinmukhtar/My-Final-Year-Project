const router = require('express').Router();
const donationController = require('../controllers/donationController');
const { uploadDonationItemPhoto } = require('../middleware/uploadChildFiles');

// GET /donations - List all donation records
router.get('/', donationController.index);

// GET /donations/new - Show creation form
router.get('/new', donationController.new);

// POST /donations - Submit new donation
router.post('/', uploadDonationItemPhoto, donationController.create);

// GET /donations/:id/edit - Show edit form
router.get('/:id/edit', donationController.edit);

// POST /donations/:id - Submit updated request details
router.post('/:id', uploadDonationItemPhoto, donationController.update);

// POST /donations/:id/delete - Delete donation
router.post('/:id/delete', donationController.delete);

module.exports = router;
