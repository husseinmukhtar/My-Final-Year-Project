const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const { uploadDonationItemPhoto } = require('../middleware/uploadChildFiles');

// Show the public landing page with donation form
router.get('/', publicController.showLanding);

// Handle the donation submission from non-admins
router.post('/donate', uploadDonationItemPhoto, publicController.submitDonation);

// React donation checkout page
router.get('/checkout', publicController.showCheckout);

// Public adoption application form
router.get('/apply-adoption', publicController.showAdoptionForm);
router.post('/apply-adoption', publicController.submitAdoptionApplication);

module.exports = router;
