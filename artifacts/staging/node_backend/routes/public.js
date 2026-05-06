const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

// Show the public landing page with donation form
router.get('/', publicController.showLanding);

// Handle the donation submission from non-admins
router.post('/donate', publicController.submitDonation);

// Show the React donation checkout page
router.get('/checkout', publicController.showCheckout);

module.exports = router;
