const express = require('express');
const router = express.Router();


const childController = require('../controllers/childController');
const { uploadChildFiles } = require('../middleware/uploadChildFiles');

// GET /children/dashboard - Show summary dashboard
router.get('/dashboard', childController.dashboard);

// GET /children - List all children
router.get('/', childController.index);

// GET /children/new - Show creation form


// POST /children/save-draft - Save incomplete registration
router.post('/save-draft', uploadChildFiles, childController.saveDraft);

// POST /children - Create a new child (final submit)
router.post('/', uploadChildFiles, childController.create);

// GET /children/:id/edit - Show edit form


// POST /children/:id - Update an existing child (using POST for HTML forms)
router.post('/:id', uploadChildFiles, childController.update);

// POST /children/:id/delete - Delete a child


module.exports = router;
