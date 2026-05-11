const express = require('express');
const router = express.Router();
const adoptionController = require('../controllers/adoptionController');

router.get('/', adoptionController.getAllAdoptions);

router.get('/:id', adoptionController.getAdoptionById);
router.post('/:id/accept', adoptionController.acceptAdoption);
router.put('/:id/schedule', adoptionController.scheduleAdoptionVisit);
router.get('/:id/edit', adoptionController.getEditForm);
router.put('/:id', adoptionController.updateAdoption);
router.delete('/:id', adoptionController.deleteAdoption);
router.post('/:id/complete', adoptionController.completeVisit);

module.exports = router;
