const express = require('express');
const router = express.Router();
const childController = require('../controllers/childController');

// GET /children/dashboard - Show summary dashboard
router.get('/dashboard', childController.dashboard);

// GET /children - List all children
router.get('/', childController.index);

// GET /children/new - Show creation form
router.get('/new', childController.new);

// POST /children - Create a new child
router.post('/', childController.create);

// GET /children/:id/edit - Show edit form
router.get('/:id/edit', childController.edit);

// POST /children/:id - Update an existing child (using POST for HTML forms)
router.post('/:id', childController.update);

// POST /children/:id/delete - Delete a child
router.post('/:id/delete', childController.delete);

module.exports = router;
