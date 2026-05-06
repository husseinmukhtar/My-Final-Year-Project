const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');

router.get('/', publicController.showHome);
router.get('/about', publicController.showAbout);
router.get('/contact', publicController.showContact);
router.get('/donate', publicController.showDonate);

module.exports = router;
