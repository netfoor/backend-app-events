const asyncHandler = require('express-async-handler');
const Main = require('../models/Main');
const { isHexColor } = require('../utils/validations');

// @desc    Obtener configuración de la aplicación
// @route   GET /api/main
// @access  Public
const getMainConfig = asyncHandler(async (req, res) => {
  // Buscar configuración existente o crear una por defecto
  let mainConfig = await Main.findOne();
  
  if (!mainConfig) {
    mainConfig = await Main.create({
      title: 'Event App',
      subtitle: 'Gestión de eventos',
      welcome: 'Bienvenido a Event App',
      infoColor: '#000000',
      bgColor: '#FFFFFF',
      linkColor: '#0000FF',
      btnColor: '#007BFF',
      secColor: '#6C757D',
      starColor: '#FFD700',
      company: 'Mi Empresa',
      infoMail: 'info@miempresa.com',
      infoPhone: '+1234567890',
      createdAt: Date.now()
    });
  }

  res.json(mainConfig);
});

// @desc    Actualizar configuración de la aplicación
// @route   PUT /api/main
// @access  Private/Admin
const updateMainConfig = asyncHandler(async (req, res) => {
  // Buscar configuración existente o crear una por defecto
  let mainConfig = await Main.findOne();
  
  if (!mainConfig) {
    mainConfig = await Main.create({
      title: 'Event App',
      subtitle: 'Gestión de eventos',
      welcome: 'Bienvenido a Event App',
      infoColor: '#000000',
      bgColor: '#FFFFFF',
      linkColor: '#0000FF',
      btnColor: '#007BFF',
      secColor: '#6C757D',
      starColor: '#FFD700',
      company: 'Mi Empresa',
      infoMail: 'info@miempresa.com',
      infoPhone: '+1234567890',
      createdAt: Date.now(),
      changedBy: req.user._id
    });
  }

  // Validación de colores si se proporcionan
  const colorFields = ['infoColor', 'bgColor', 'linkColor', 'btnColor', 'secColor', 'starColor'];
  
  for (const field of colorFields) {
    if (req.body[field] && !isHexColor(req.body[field])) {
      res.status(400);
      throw new Error(`El color ${field} debe ser un color hexadecimal válido`);
    }
  }

  // Actualizar campos
  mainConfig.title = req.body.title || mainConfig.title;
  mainConfig.subtitle = req.body.subtitle || mainConfig.subtitle;
  mainConfig.welcome = req.body.welcome || mainConfig.welcome;
  
  for (const field of colorFields) {
    if (req.body[field]) {
      mainConfig[field] = req.body[field];
    }
  }

  mainConfig.company = req.body.company || mainConfig.company;
  mainConfig.infoMail = req.body.infoMail || mainConfig.infoMail;
  mainConfig.infoPhone = req.body.infoPhone || mainConfig.infoPhone;

  // Actualizar información de cambios
  mainConfig.changedDate = Date.now();
  mainConfig.changedBy = req.user._id;
  mainConfig.changedHistory.push({
    date: new Date(),
    user: req.user._id,
    changeType: 'update'
  });

  const updatedConfig = await mainConfig.save();
  res.json(updatedConfig);
});

// @desc    Subir logo de la aplicación
// @route   POST /api/main/logo
// @access  Private/Admin
const uploadMainLogo = asyncHandler(async (req, res) => {
  // Buscar configuración existente o crear una por defecto
  let mainConfig = await Main.findOne();
  
  if (!mainConfig) {
    mainConfig = await Main.create({
      title: 'Event App',
      subtitle: 'Gestión de eventos',
      welcome: 'Bienvenido a Event App',
      infoColor: '#000000',
      bgColor: '#FFFFFF',
      linkColor: '#0000FF',
      btnColor: '#007BFF',
      secColor: '#6C757D',
      starColor: '#FFD700',
      company: 'Mi Empresa',
      infoMail: 'info@miempresa.com',
      infoPhone: '+1234567890',
      createdAt: Date.now(),
      changedBy: req.user._id
    });
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Por favor sube un archivo');
  }

  // Actualizar el logo
  mainConfig.logo = req.file.path; // URL de Cloudinary
  
  // Actualizar información de cambios
  mainConfig.changedDate = Date.now();
  mainConfig.changedBy = req.user._id;
  mainConfig.changedHistory.push({
    date: new Date(),
    user: req.user._id,
    changeType: 'update-logo'
  });

  const updatedConfig = await mainConfig.save();

  res.json({
    message: 'Logo subido correctamente',
    logoUrl: updatedConfig.logo
  });
});

module.exports = {
  getMainConfig,
  updateMainConfig,
  uploadMainLogo
};