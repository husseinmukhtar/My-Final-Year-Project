const express = require('express');
const router = express.Router();


const { requireAdmin } = require('../middleware/authMiddleware');
const adoptionController = require('../controllers/adoptionController');

router.get('/', adoptionController.getAllAdoptions);

router.get('/:id', adoptionController.getAdoptionById);

router.get('/:id/edit', adoptionController.getEditForm);

router.delete('/:id', requireAdmin, adoptionController.deleteAdoption);

module.exports = router;
