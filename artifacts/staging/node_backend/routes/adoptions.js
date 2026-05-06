const express = require('express');
const router = express.Router();
const adoptionController = require('../controllers/adoptionController');

// GET /adoptions - List all adoption requests
router.get('/', adoptionController.index);

// GET /adoptions/new - Show creation form
router.get('/new', adoptionController.new);

// POST /adoptions - Submit new adoption request
router.post('/', adoptionController.create);

// GET /adoptions/:id/edit - Show edit form
router.get('/:id/edit', adoptionController.edit);

// POST /adoptions/:id - Submit updated adoption request details
router.post('/:id', adoptionController.update);

// POST /adoptions/:id/delete - Delete adoption request
router.post('/:id/delete', adoptionController.delete);

module.exports = router;
