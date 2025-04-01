const express = require('express');
const router = express.Router();
const {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,
  uploadEventLogo,
  uploadEventMainImage,
  uploadEventPhotos,
  addOperator,
  removeOperator,
  addAssistant,
  removeAssistant
} = require('../controllers/eventController');
const { protect, isAdmin } = require('../middleware/auth');
const { uploadLogo, uploadEventPhoto, uploadMultiplePhotos } = require('../middleware/upload');

// Rutas para eventos
router.route('/')
  .get(getEvents)
  .post(protect, isAdmin, createEvent);

router.route('/:id')
  .get(getEventById)
  .put(protect, updateEvent)
  .delete(protect, isAdmin, deleteEvent);

// Rutas para fotos y logos
router.post('/:id/logo', protect, uploadLogo, uploadEventLogo);
router.post('/:id/mainImage', protect, uploadEventPhoto, uploadEventMainImage);
router.post('/:id/photos', protect, uploadMultiplePhotos, uploadEventPhotos);

// Rutas para operadores y asistentes
router.route('/:id/operators')
  .post(protect, isAdmin, addOperator);

router.route('/:id/operators/:userId')
  .delete(protect, isAdmin, removeOperator);

router.route('/:id/assistants')
  .post(protect, addAssistant);

router.route('/:id/assistants/:userId')
  .delete(protect, removeAssistant);

module.exports = router;