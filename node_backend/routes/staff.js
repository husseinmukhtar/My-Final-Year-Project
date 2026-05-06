const router = require('express').Router();
const staffController = require('../controllers/staffController');

// GET /staff - List all staff records
router.get('/', staffController.index);

// GET /staff/new - Show creation form
router.get('/new', staffController.new);

// POST /staff - Submit new staff request
router.post('/', staffController.create);

// GET /staff/:id/edit - Show edit form
router.get('/:id/edit', staffController.edit);

// POST /staff/:id - Submit updated staff request details
router.post('/:id', staffController.update);

// POST /staff/:id/delete - Delete staff request
router.post('/:id/delete', staffController.delete);

module.exports = router;
