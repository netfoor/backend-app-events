const express = require('express');
const router = express.Router();
const {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
  addWitness,
  removeWitness,
  incrementTakenSeats,
  decrementTakenSeats
} = require('../controllers/activityController');
const { protect, isAdmin } = require('../middleware/auth');

// Rutas para actividades dentro de eventos
router.route('/events/:eventId/activities')
  .get(getActivities)
  .post(protect, createActivity);

// Rutas para actividades individuales
router.route('/:id')
  .get(getActivityById)
  .put(protect, updateActivity)
  .delete(protect, isAdmin, deleteActivity);

// Rutas para testigos
router.route('/:id/witnesses')
  .post(protect, addWitness);

router.route('/:id/witnesses/:userId')
  .delete(protect, removeWitness);

// Rutas para gestión de asientos
router.route('/:id/seats/increment')
  .put(protect, incrementTakenSeats);

router.route('/:id/seats/decrement')
  .put(protect, decrementTakenSeats);

module.exports = router;