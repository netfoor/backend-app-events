const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración del storage para imágenes
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'event-app',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf']
  }
});

// Middleware para upload de archivos
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Límite de 5MB
});

module.exports = {
  cloudinary,
  upload
};