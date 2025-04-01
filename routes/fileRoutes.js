const express = require('express');
const router = express.Router();
const {
  uploadFile,
  getFiles,
  getFilesByOwner,
  getFilesByTarget,
  getFileById,
  deleteFile,
  updateFile
} = require('../controllers/fileController');
const { protect, isAdmin } = require('../middleware/auth');
const multer = require('multer');
const { cloudinary } = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configuración básica para cualquier tipo de archivo
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'event-app/files',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Rutas para archivos
router.route('/')
  .get(protect, isAdmin, getFiles)
  .post(protect, upload.single('file'), uploadFile);

router.route('/:id')
  .get(protect, getFileById)
  .put(protect, updateFile)
  .delete(protect, deleteFile);

// Obtener archivos por propietario o por objetivo
router.get('/owner/:userId', protect, getFilesByOwner);
router.get('/target/:targetModel/:targetId', protect, getFilesByTarget);

module.exports = router;