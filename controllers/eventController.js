const asyncHandler = require('express-async-handler');
const Event = require('../models/Event');
const Activity = require('../models/Activity');
const { isFutureDate, isNotEmpty, isHexColor } = require('../utils/validations');
const { cloudinary } = require('../config/cloudinary');

// @desc    Crear un nuevo evento
// @route   POST /api/events
// @access  Private/Admin
const createEvent = asyncHandler(async (req, res) => {
  const { 
    title, subtitle, description, place, 
    dateStart, timeStart, dateEnd, timeEnd, 
    isPublic, infoColor, bgColor, starColor 
  } = req.body;

  // Validaciones básicas
  if (!title) {
    res.status(400);
    throw new Error('El título es requerido');
  }

  // Validación de colores si se proporcionan
  if (infoColor && !isHexColor(infoColor)) {
    res.status(400);
    throw new Error('El color de información debe ser un color hexadecimal válido');
  }
  
  if (bgColor && !isHexColor(bgColor)) {
    res.status(400);
    throw new Error('El color de fondo debe ser un color hexadecimal válido');
  }
  
  if (starColor && !isHexColor(starColor)) {
    res.status(400);
    throw new Error('El color de estrellas debe ser un color hexadecimal válido');
  }

  // Crear el evento
  const event = await Event.create({
    title,
    subtitle,
    description,
    place,
    dateStart: dateStart ? new Date(dateStart) : undefined,
    timeStart,
    dateEnd: dateEnd ? new Date(dateEnd) : undefined,
    timeEnd,
    isPublic: isPublic !== undefined ? isPublic : true,
    infoColor,
    bgColor,
    starColor,
    createdAt: Date.now(),
    changedBy: req.user._id,
    changedType: 'create',
    changedHistory: [{
      date: new Date(),
      user: req.user._id,
      changeType: 'create'
    }]
  });

  if (event) {
    res.status(201).json(event);
  } else {
    res.status(400);
    throw new Error('Datos de evento inválidos');
  }
});

// @desc    Obtener todos los eventos
// @route   GET /api/events
// @access  Public o Private según isPublic
const getEvents = asyncHandler(async (req, res) => {
  // Si el usuario no está autenticado, solo ver eventos públicos
  const filter = !req.user ? { isPublic: true, isDeleted: false } : { isDeleted: false };
  
  // Para usuarios normales, solo eventos públicos o donde son asistentes/operadores
  if (req.user && req.user.role === 'user') {
    filter.$or = [
      { isPublic: true },
      { assistants: req.user._id },
      { 'operators.user': req.user._id }
    ];
  }

  const events = await Event.find(filter)
    .populate('activities', 'title date time place')
    .sort({ dateStart: 1 });

  res.json(events);
});

// @desc    Obtener un evento por ID
// @route   GET /api/events/:id
// @access  Public o Private según isPublic
const getEventById = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id)
    .populate('activities')
    .populate('califications')
    .populate('witnesses')
    .populate({
      path: 'operators.user',
      select: 'name email'
    })
    .populate({
      path: 'assistants',
      select: 'name email'
    });

  if (event && !event.isDeleted) {
    // Verificar acceso si no es público
    if (!event.isPublic && (!req.user || (req.user.role !== 'admin' && 
        !event.assistants.some(assistant => assistant._id.toString() === req.user._id.toString()) && 
        !event.operators.some(op => op.user._id.toString() === req.user._id.toString())))) {
      res.status(403);
      throw new Error('No tienes permiso para ver este evento');
    }

    res.json(event);
  } else {
    res.status(404);
    throw new Error('Evento no encontrado');
  }
});

// @desc    Actualizar un evento
// @route   PUT /api/events/:id
// @access  Private/Admin o Operator
const updateEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (event && !event.isDeleted) {
    // Verificar permisos (solo admin o operador general)
    if (req.user.role !== 'admin' && 
        !event.operators.some(op => op.user.toString() === req.user._id.toString() && op.role === 'general')) {
      res.status(403);
      throw new Error('No tienes permiso para actualizar este evento');
    }

    // Actualizar campos
    event.title = req.body.title || event.title;
    event.subtitle = req.body.subtitle || event.subtitle;
    event.description = req.body.description || event.description;
    event.place = req.body.place || event.place;
    
    if (req.body.dateStart) event.dateStart = new Date(req.body.dateStart);
    if (req.body.timeStart) event.timeStart = req.body.timeStart;
    if (req.body.dateEnd) event.dateEnd = new Date(req.body.dateEnd);
    if (req.body.timeEnd) event.timeEnd = req.body.timeEnd;
    
    // Solo admin puede cambiar isPublic
    if (req.user.role === 'admin' && req.body.isPublic !== undefined) {
      event.isPublic = req.body.isPublic;
    }

    // Actualizar colores
    if (req.body.infoColor && isHexColor(req.body.infoColor)) event.infoColor = req.body.infoColor;
    if (req.body.bgColor && isHexColor(req.body.bgColor)) event.bgColor = req.body.bgColor;
    if (req.body.starColor && isHexColor(req.body.starColor)) event.starColor = req.body.starColor;

    // Actualizar información de cambios
    event.changedDate = Date.now();
    event.changedBy = req.user._id;
    event.changedType = 'update';
    event.changedHistory.push({
      date: new Date(),
      user: req.user._id,
      changeType: 'update'
    });

    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } else {
    res.status(404);
    throw new Error('Evento no encontrado');
  }
});

// @desc    Eliminar un evento
// @route   DELETE /api/events/:id
// @access  Private/Admin
const deleteEvent = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (event) {
    // Solo administradores pueden eliminar eventos
    if (req.user.role !== 'admin') {
      res.status(403);
      throw new Error('No tienes permiso para eliminar este evento');
    }

    // Marcar como eliminado en lugar de eliminar físicamente
    event.isDeleted = true;
    event.changedDate = Date.now();
    event.changedBy = req.user._id;
    event.changedType = 'delete';
    event.changedHistory.push({
      date: new Date(),
      user: req.user._id,
      changeType: 'delete'
    });

    await event.save();
    res.json({ message: 'Evento eliminado' });
  } else {
    res.status(404);
    throw new Error('Evento no encontrado');
  }
});

// @desc    Subir logo para un evento
// @route   POST /api/events/:id/logo
// @access  Private/Admin o Operator
const uploadEventLogo = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event || event.isDeleted) {
    res.status(404);
    throw new Error('Evento no encontrado');
  }

  // Verificar permisos
  if (req.user.role !== 'admin' && 
      !event.operators.some(op => op.user.toString() === req.user._id.toString() && op.role === 'general')) {
    res.status(403);
    throw new Error('No tienes permiso para actualizar este evento');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Por favor sube un archivo');
  }

  // Actualizar el logo del evento
  event.logo = req.file.path; // URL de Cloudinary
  
  // Actualizar información de cambios
  event.changedDate = Date.now();
  event.changedBy = req.user._id;
  event.changedType = 'update';
  event.changedHistory.push({
    date: new Date(),
    user: req.user._id,
    changeType: 'update-logo'
  });

  const updatedEvent = await event.save();

  res.json({
    message: 'Logo subido correctamente',
    logoUrl: updatedEvent.logo
  });
});

// @desc    Subir imagen principal para un evento
// @route   POST /api/events/:id/mainImage
// @access  Private/Admin o Operator
const uploadEventMainImage = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event || event.isDeleted) {
    res.status(404);
    throw new Error('Evento no encontrado');
  }

  // Verificar permisos
  if (req.user.role !== 'admin' && 
      !event.operators.some(op => op.user.toString() === req.user._id.toString() && op.role === 'general')) {
    res.status(403);
    throw new Error('No tienes permiso para actualizar este evento');
  }

  if (!req.file) {
    res.status(400);
    throw new Error('Por favor sube un archivo');
  }

  // Actualizar la imagen principal del evento
  event.mainImage = req.file.path; // URL de Cloudinary
  
  // Actualizar información de cambios
  event.changedDate = Date.now();
  event.changedBy = req.user._id;
  event.changedType = 'update';
  event.changedHistory.push({
    date: new Date(),
    user: req.user._id,
    changeType: 'update-main-image'
  });

  const updatedEvent = await event.save();

  res.json({
    message: 'Imagen principal subida correctamente',
    mainImageUrl: updatedEvent.mainImage
  });
});

// @desc    Subir fotos para un evento
// @route   POST /api/events/:id/photos
// @access  Private/Admin o Operator o User
const uploadEventPhotos = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event || event.isDeleted) {
    res.status(404);
    throw new Error('Evento no encontrado');
  }

  // Verificar que el usuario sea administrador, operador o asistente
  const isOperator = event.operators.some(op => op.user.toString() === req.user._id.toString());
  const isAssistant = event.assistants.some(assist => assist.toString() === req.user._id.toString());
  
  if (req.user.role !== 'admin' && !isOperator && !isAssistant) {
    res.status(403);
    throw new Error('No tienes permiso para subir fotos a este evento');
  }

  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('Por favor sube al menos una foto');
  }

  // Obtener las URLs de las fotos subidas
  const photoUrls = req.files.map(file => file.path);

  // Agregar las nuevas fotos al evento
  event.photos = [...event.photos, ...photoUrls];
  
  // Actualizar información de cambios
  event.changedDate = Date.now();
  event.changedBy = req.user._id;
  event.changedType = 'update';
  event.changedHistory.push({
    date: new Date(),
    user: req.user._id,
    changeType: 'upload-photos'
  });

  const updatedEvent = await event.save();

  res.json({
    message: 'Fotos subidas correctamente',
    photos: photoUrls
  });
});

// @desc    Agregar operador a un evento
// @route   POST /api/events/:id/operators
// @access  Private/Admin
const addOperator = asyncHandler(async (req, res) => {
  const { userId, role, activities } = req.body;
  
  if (!userId || !role) {
    res.status(400);
    throw new Error('El ID de usuario y rol son requeridos');
  }

  const event = await Event.findById(req.params.id);
  
  if (!event || event.isDeleted) {
    res.status(404);
    throw new Error('Evento no encontrado');
  }

  // Verificar que el usuario no sea ya un operador del evento
  if (event.operators.some(op => op.user.toString() === userId)) {
    res.status(400);
    throw new Error('El usuario ya es operador de este evento');
  }

  // Agregar el operador
  event.operators.push({
    user: userId,
    role,
    activities: activities || []
  });

  // Actualizar información de cambios
  event.changedDate = Date.now();
  event.changedBy = req.user._id;
  event.changedType = 'update';
  event.changedHistory.push({
    date: new Date(),
    user: req.user._id,
    changeType: 'add-operator'
  });

  const updatedEvent = await event.save();

  res.json({
    message: 'Operador agregado correctamente',
    operators: updatedEvent.operators
  });
});

// @desc    Eliminar operador de un evento
// @route   DELETE /api/events/:id/operators/:userId
// @access  Private/Admin
const removeOperator = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  
  if (!event || event.isDeleted) {
    res.status(404);
    throw new Error('Evento no encontrado');
  }

  // Verificar que el usuario es un operador del evento
  const operatorIndex = event.operators.findIndex(op => op.user.toString() === req.params.userId);
  
  if (operatorIndex === -1) {
    res.status(404);
    throw new Error('Operador no encontrado');
  }

  // Eliminar el operador
  event.operators.splice(operatorIndex, 1);

  // Actualizar información de cambios
  event.changedDate = Date.now();
  event.changedBy = req.user._id;
  event.changedType = 'update';
  event.changedHistory.push({
    date: new Date(),
    user: req.user._id,
    changeType: 'remove-operator'
  });

  const updatedEvent = await event.save();

  res.json({
    message: 'Operador eliminado correctamente',
    operators: updatedEvent.operators
  });
});

// @desc    Agregar asistente a un evento
// @route   POST /api/events/:id/assistants
// @access  Private/Admin o Operator
const addAssistant = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    res.status(400);
    throw new Error('El ID de usuario es requerido');
  }

  const event = await Event.findById(req.params.id);
  
  if (!event || event.isDeleted) {
    res.status(404);
    throw new Error('Evento no encontrado');
  }

  // Verificar permisos
  const isOperator = event.operators.some(op => 
    op.user.toString() === req.user._id.toString() && 
    (op.role === 'general' || op.role === 'assistant')
  );
  
  if (req.user.role !== 'admin' && !isOperator) {
    res.status(403);
    throw new Error('No tienes permiso para agregar asistentes a este evento');
  }

  // Verificar que el usuario no sea ya un asistente del evento
  if (event.assistants.includes(userId)) {
    res.status(400);
    throw new Error('El usuario ya es asistente de este evento');
  }

  // Agregar el asistente
  event.assistants.push(userId);

  // Actualizar información de cambios
  event.changedDate = Date.now();
  event.changedBy = req.user._id;
  event.changedType = 'update';
  event.changedHistory.push({
    date: new Date(),
    user: req.user._id,
    changeType: 'add-assistant'
  });

  const updatedEvent = await event.save();

  res.json({
    message: 'Asistente agregado correctamente',
    assistants: updatedEvent.assistants
  });
});

// @desc    Eliminar asistente de un evento
// @route   DELETE /api/events/:id/assistants/:userId
// @access  Private/Admin o Operator
const removeAssistant = asyncHandler(async (req, res) => {
  const event = await Event.findById(req.params.id);
  
  if (!event || event.isDeleted) {
    res.status(404);
    throw new Error('Evento no encontrado');
  }

  // Verificar permisos
  const isOperator = event.operators.some(op => 
    op.user.toString() === req.user._id.toString() && 
    (op.role === 'general' || op.role === 'assistant')
  );
  
  if (req.user.role !== 'admin' && !isOperator) {
    res.status(403);
    throw new Error('No tienes permiso para eliminar asistentes de este evento');
  }

  // Verificar que el usuario es un asistente del evento
  const assistantIndex = event.assistants.findIndex(a => a.toString() === req.params.userId);
  
  if (assistantIndex === -1) {
    res.status(404);
    throw new Error('Asistente no encontrado');
  }

  // Eliminar el asistente
  event.assistants.splice(assistantIndex, 1);

  // Actualizar información de cambios
  event.changedDate = Date.now();
  event.changedBy = req.user._id;
  event.changedType = 'update';
  event.changedHistory.push({
    date: new Date(),
    user: req.user._id,
    changeType: 'remove-assistant'
  });

  const updatedEvent = await event.save();

  res.json({
    message: 'Asistente eliminado correctamente',
    assistants: updatedEvent.assistants
  });
});

module.exports = {
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
};