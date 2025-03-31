const asyncHandler = require('express-async-handler');
const File = require('../models/File');
const { cloudinary } = require('../config/cloudinary');

// @desc    Subir un archivo
// @route   POST /api/files
// @access  Private
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Por favor sube un archivo');
  }

  const { title, description, type, target, targetModel } = req.body;

  // Validar modelo objetivo si se proporciona
  if (targetModel && !['Event', 'Activity', 'User', null].includes(targetModel)) {
    res.status(400);
    throw new Error('El tipo de objetivo debe ser Event, Activity, User o null');
  }

  // Determinar el tipo de archivo basado en el MIME type
  let fileType = 'other';
  if (req.file.mimetype.startsWith('image/')) {
    fileType = 'image';
  } else if (req.file.mimetype === 'application/pdf') {
    fileType = 'document';
  } else if (req.file.mimetype.startsWith('video/')) {
    fileType = 'video';
  }

  // Crear el archivo
  const file = await File.create({
    location: req.file.path, // URL de Cloudinary
    title: title || req.file.originalname,
    description,
    type: type || fileType,
    owner: req.user._id,
    target,
    targetModel,
    publicId: req.file.filename, // ID público de Cloudinary
    size: req.file.size,
    format: req.file.format || req.file.mimetype.split('/')[1],
    createdAt: Date.now()
  });

  if (file) {
    res.status(201).json(file);
  } else {
    res.status(400);
    throw new Error('Error al crear el archivo');
  }
});

// @desc    Obtener todos los archivos
// @route   GET /api/files
// @access  Private/Admin
const getFiles = asyncHandler(async (req, res) => {
  // Para administradores, todos los archivos
  const files = await File.find()
    .populate('owner', 'name')
    .sort({ createdAt: -1 });

  res.json(files);
});

// @desc    Obtener archivos por propietario
// @route   GET /api/files/owner/:userId
// @access  Private
const getFilesByOwner = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  // Un usuario solo puede ver sus propios archivos a menos que sea admin
  if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('No tienes permiso para ver los archivos de este usuario');
  }

  const files = await File.find({ owner: userId })
    .sort({ createdAt: -1 });

  res.json(files);
});

// @desc    Obtener archivos por objetivo
// @route   GET /api/files/target/:targetModel/:targetId
// @access  Private
const getFilesByTarget = asyncHandler(async (req, res) => {
  const { targetModel, targetId } = req.params;

  // Validar modelo objetivo
  if (!['Event', 'Activity', 'User'].includes(targetModel)) {
    res.status(400);
    throw new Error('El tipo de objetivo debe ser Event, Activity o User');
  }

  // Verificar permisos según el modelo objetivo
  if (targetModel === 'User' && targetId !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('No tienes permiso para ver estos archivos');
  }

  const files = await File.find({
    target: targetId,
    targetModel
  })
    .populate('owner', 'name')
    .sort({ createdAt: -1 });

  res.json(files);
});

// @desc    Obtener un archivo por ID
// @route   GET /api/files/:id
// @access  Private
const getFileById = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id)
    .populate('owner', 'name');

  if (!file) {
    res.status(404);
    throw new Error('Archivo no encontrado');
  }

  // Verificar permisos
  if (file.owner._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    // Verificar si el archivo está asociado a un objetivo al que el usuario tiene acceso
    // Esta lógica debería ampliarse según los requisitos específicos
    res.status(403);
    throw new Error('No tienes permiso para ver este archivo');
  }

  res.json(file);
});

// @desc    Eliminar un archivo
// @route   DELETE /api/files/:id
// @access  Private
const deleteFile = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id);

  if (!file) {
    res.status(404);
    throw new Error('Archivo no encontrado');
  }

  // Verificar permisos
  if (file.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('No tienes permiso para eliminar este archivo');
  }

  // Eliminar de Cloudinary
  if (file.publicId) {
    await cloudinary.uploader.destroy(file.publicId);
  }

  // Eliminar de la base de datos
  await file.remove();

  res.json({ message: 'Archivo eliminado' });
});

// @desc    Actualizar un archivo
// @route   PUT /api/files/:id
// @access  Private
const updateFile = asyncHandler(async (req, res) => {
  const file = await File.findById(req.params.id);

  if (!file) {
    res.status(404);
    throw new Error('Archivo no encontrado');
  }

  // Verificar permisos
  if (file.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('No tienes permiso para actualizar este archivo');
  }

  // Actualizar campos
  file.title = req.body.title || file.title;
  file.description = req.body.description !== undefined ? req.body.description : file.description;
  
  if (req.body.type && ['image', 'document', 'video', 'other'].includes(req.body.type)) {
    file.type = req.body.type;
  }

  if (req.body.target) file.target = req.body.target;
  
  if (req.body.targetModel && ['Event', 'Activity', 'User', null].includes(req.body.targetModel)) {
    file.targetModel = req.body.targetModel;
  }

  const updatedFile = await file.save();
  res.json(updatedFile);
});

module.exports = {
  uploadFile,
  getFiles,
  getFilesByOwner,
  getFilesByTarget,
  getFileById,
  deleteFile,
  updateFile
};