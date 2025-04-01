const express = require('express');
const router = express.Router();
const {
  createCalification,
  getCalifications,
  updateCalification,
  deleteCalification,
  getCalificationById
} = require('../controllers/calificationController');
const { protect } = require('../middleware/auth');

// Rutas para calificaciones
router.route('/')
  .post(protect, createCalification);

router.route('/:id')
  .get(getCalificationById)
  .put(protect, updateCalification)
  .delete(protect, deleteCalification);

// Obtener calificaciones por objetivo
router.get('/:targetModel/:targetId', getCalifications);

module.exports = router;