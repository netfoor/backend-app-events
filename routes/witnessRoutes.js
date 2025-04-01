const express = require('express');
const router = express.Router();
const {
  createWitness,
  getWitnesses,
  getWitnessesByTarget,
  getWitnessesByUser,
  deleteWitness
} = require('../controllers/witnessController');
const { protect, isAdmin } = require('../middleware/auth');

// Rutas para testigos
router.route('/')
  .get(protect, isAdmin, getWitnesses)
  .post(protect, createWitness);

router.route('/:id')
  .delete(protect, deleteWitness);

// Obtener testigos por objetivo o usuario
router.get('/:targetModel/:targetId', protect, getWitnessesByTarget);
router.get('/user/:userId', protect, getWitnessesByUser);

module.exports = router;