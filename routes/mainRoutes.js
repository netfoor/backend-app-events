const express = require('express');
const router = express.Router();
const {
  getMainConfig,
  updateMainConfig,
  uploadMainLogo
} = require('../controllers/mainController');
const { protect, isAdmin } = require('../middleware/auth');
const { uploadLogo } = require('../middleware/upload');

// Rutas para configuración principal
router.route('/')
  .get(getMainConfig)
  .put(protect, isAdmin, updateMainConfig);

// Subir logo de la aplicación
router.post('/logo', protect, isAdmin, uploadLogo, uploadMainLogo);

module.exports = router;