const router = require('express').Router();
const staffController = require('../controllers/staffController');



// GET /staff - List all staff records
router.get('/', staffController.index);

// GET /staff/new - Show creation form


// POST /staff - Submit new staff request


// GET /staff/:id/edit - Show edit form


// POST /staff/:id - Submit updated staff request details


// POST /staff/:id/delete - Delete staff request


module.exports = router;
