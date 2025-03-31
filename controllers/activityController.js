const asyncHandler = require('express-async-handler');
const Activity = require('../models/Activity');
const Event = require('../models/Event');
const { isFutureDate, isNotEmpty, isHexColor } = require('../utils/validations');

// @desc    Crear una nueva actividad para un evento
// @route   POST /api/events/:eventId/activities
// @access  Private/Admin o Operator
const createActivity = asyncHandler(async (req, res) => {
  const { 
    title, subtitle, description, organization, 
    date, time, place, ticketType, 
    infoColor, bgColor, starColor, seats 
  } = req.body;

  const eventId = req.params.eventId;

  // Verificar que el evento existe
  const event = await Event.findById(eventId);
  if (!event || event.isDeleted) {
    res.status(404);
    throw new Error('Evento no encontrado');
  }

  // Verificar permisos (solo admin o operador general/activity)
  const isOperator = event.operators.some(op => 
    op.user.toString() === req.user._id.toString() && 
    (op.role === 'general' || op.role === 'activity')
  );
  
  if (req.user.role !== 'admin' && !isOperator) {
    res.status(403);
    throw new Error('No tienes permiso para crear actividades en este evento');
  }

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

  // Crear la actividad
  const activity = await Activity.create({
    ticketType: ticketType || 0,
    title,
    subtitle,
    description,
    organization,
    date: date ? new Date(date) : undefined,
    time,
    place,
    infoColor,
    bgColor,
    starColor,
    seats: seats || 0,
    createdAt: Date.now(),
    changedBy: req.user._id,
    changedType: 'create',
    changedHistory: [{
      date: new Date(),
      user: req.user._id,
      changeType: 'create'
    }]
  });

  if (activity) {
    // Agregar la actividad al evento
    event.activities.push(activity._id);
    await event.save();

    res.status(201).json(activity);
  } else {
    res.status(400);
    throw new Error('Datos de actividad inválidos');
  }
});

// @desc    Obtener todas las actividades de un evento
// @route   GET /api/events/:eventId/activities
// @access  Public o Private según isPublic del evento
const getActivities = asyncHandler(async (req, res) => {
  const eventId = req.params.eventId;

  // Verificar que el evento existe
  const event = await Event.findById(eventId);
  if (!event || event.isDeleted) {
    res.status(404);
    throw new Error('Evento no encontrado');
  }

  // Verificar permisos si el evento no es público
  if (!event.isPublic && (!req.user || (req.user.role !== 'admin' && 
      !event.assistants.some(a => a.toString() === req.user._id.toString()) && 
      !event.operators.some(op => op.user.toString() === req.user._id.toString())))) {
    res.status(403);
    throw new Error('No tienes permiso para ver las actividades de este evento');
  }

  // Obtener actividades no eliminadas
  const activities = await Activity.find({
    _id: { $in: event.activities },
    isDeleted: false
  }).sort({ date: 1, time: 1 });

  res.json(activities);
});

// @desc    Obtener una actividad por ID
// @route   GET /api/activities/:id
// @access  Public o Private según isPublic del evento asociado
const getActivityById = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id)
    .populate('califications')
    .populate('witnesses');

  if (!activity || activity.isDeleted) {
    res.status(404);
    throw new Error('Actividad no encontrada');
  }

  // Verificar permisos a través del evento asociado
  const events = await Event.find({ 
    activities: activity._id,
    isDeleted: false
  });

  if (events.length === 0) {
    res.status(404);
    throw new Error('Evento asociado no encontrado');
  }

  const event = events[0]; // Tomamos el primer evento que contenga esta actividad

  // Verificar permisos si el evento no es público
  if (!event.isPublic && (!req.user || (req.user.role !== 'admin' && 
      !event.assistants.some(a => a.toString() === req.user._id.toString()) && 
      !event.operators.some(op => op.user.toString() === req.user._id.toString())))) {
    res.status(403);
    throw new Error('No tienes permiso para ver esta actividad');
  }

  res.json(activity);
});

// @desc    Actualizar una actividad
// @route   PUT /api/activities/:id
// @access  Private/Admin o Operator
const updateActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);

  if (!activity || activity.isDeleted) {
    res.status(404);
    throw new Error('Actividad no encontrada');
  }

  // Obtener el evento asociado para verificar permisos
  const events = await Event.find({ 
    activities: activity._id,
    isDeleted: false
  });

  if (events.length === 0) {
    res.status(404);
    throw new Error('Evento asociado no encontrado');
  }

  const event = events[0]; // Tomamos el primer evento que contenga esta actividad

  // Verificar permisos (solo admin o operador general/activity)
  const isOperator = event.operators.some(op => 
    op.user.toString() === req.user._id.toString() && 
    (op.role === 'general' || op.role === 'activity') &&
    (op.role !== 'activity' || !op.activities || op.activities.some(a => a.toString() === activity._id.toString()))
  );
  
  if (req.user.role !== 'admin' && !isOperator) {
    res.status(403);
    throw new Error('No tienes permiso para actualizar esta actividad');
  }

  // Actualizar campos
  activity.title = req.body.title || activity.title;
  activity.subtitle = req.body.subtitle || activity.subtitle;
  activity.description = req.body.description || activity.description;
  activity.organization = req.body.organization || activity.organization;
  
  if (req.body.date) activity.date = new Date(req.body.date);
  if (req.body.time) activity.time = req.body.time;
  activity.place = req.body.place || activity.place;
  
  // Solo admin o operador general puede cambiar el tipo de ticket
  if ((req.user.role === 'admin' || event.operators.some(op => 
      op.user.toString() === req.user._id.toString() && op.role === 'general')) 
      && req.body.ticketType !== undefined) {
    activity.ticketType = req.body.ticketType;
  }

  // Actualizar colores
  if (req.body.infoColor && isHexColor(req.body.infoColor)) activity.infoColor = req.body.infoColor;
  if (req.body.bgColor && isHexColor(req.body.bgColor)) activity.bgColor = req.body.bgColor;
  if (req.body.starColor && isHexColor(req.body.starColor)) activity.starColor = req.body.starColor;

  // Actualizar asientos
  if (req.body.seats !== undefined) activity.seats = req.body.seats;

  // Actualizar información de cambios
  activity.changedDate = Date.now();
  activity.changedBy = req.user._id;
  activity.changedType = 'update';
  activity.changedHistory.push({
    date: new Date(),
    user: req.user._id,
    changeType: 'update'
  });

  const updatedActivity = await activity.save();
  res.json(updatedActivity);
});

// @desc    Eliminar una actividad
// @route   DELETE /api/activities/:id
// @access  Private/Admin
const deleteActivity = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);

  if (!activity || activity.isDeleted) {
    res.status(404);
    throw new Error('Actividad no encontrada');
  }

  // Obtener el evento asociado
  const events = await Event.find({ 
    activities: activity._id,
    isDeleted: false
  });

  if (events.length === 0) {
    res.status(404);
    throw new Error('Evento asociado no encontrado');
  }

  // Solo administradores pueden eliminar actividades
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('No tienes permiso para eliminar esta actividad');
  }

  // Marcar como eliminada en lugar de eliminar físicamente
  activity.isDeleted = true;
  activity.changedDate = Date.now();
  activity.changedBy = req.user._id;
  activity.changedType = 'delete';
  activity.changedHistory.push({
    date: new Date(),
    user: req.user._id,
    changeType: 'delete'
  });

  await activity.save();
  res.json({ message: 'Actividad eliminada' });
});

// @desc    Agregar testigo a una actividad
// @route   POST /api/activities/:id/witnesses
// @access  Private/Admin o Operator
const addWitness = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  
  if (!userId) {
    res.status(400);
    throw new Error('El ID de usuario es requerido');
  }

  const activity = await Activity.findById(req.params.id);
  
  if (!activity || activity.isDeleted) {
    res.status(404);
    throw new Error('Actividad no encontrada');
  }

  // Obtener el evento asociado para verificar permisos
  const events = await Event.find({ 
    activities: activity._id,
    isDeleted: false
  });

  if (events.length === 0) {
    res.status(404);
    throw new Error('Evento asociado no encontrado');
  }

  const event = events[0];

  // Verificar permisos
  const isOperator = event.operators.some(op => 
    op.user.toString() === req.user._id.toString() && 
    (op.role === 'general' || op.role === 'activity' || op.role === 'assistant') &&
    (op.role !== 'activity' || !op.activities || op.activities.some(a => a.toString() === activity._id.toString()))
  );
  
  if (req.user.role !== 'admin' && !isOperator) {
    res.status(403);
    throw new Error('No tienes permiso para agregar testigos a esta actividad');
  }

  // Verificar que el usuario no sea ya un testigo de la actividad
  if (activity.witnesses.includes(userId)) {
    res.status(400);
    throw new Error('El usuario ya es testigo de esta actividad');
  }

  // Agregar el testigo
  activity.witnesses.push(userId);

  // Actualizar información de cambios
  activity.changedDate = Date.now();
  activity.changedBy = req.user._id;
  activity.changedType = 'update';
  activity.changedHistory.push({
    date: new Date(),
    user: req.user._id,
    changeType: 'add-witness'
  });

  const updatedActivity = await activity.save();

  res.json({
    message: 'Testigo agregado correctamente',
    witnesses: updatedActivity.witnesses
  });
});

// @desc    Remover testigo de una actividad
// @route   DELETE /api/activities/:id/witnesses/:userId
// @access  Private/Admin o Operator
const removeWitness = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  
  if (!activity || activity.isDeleted) {
    res.status(404);
    throw new Error('Actividad no encontrada');
  }

  // Obtener el evento asociado para verificar permisos
  const events = await Event.find({ 
    activities: activity._id,
    isDeleted: false
  });

  if (events.length === 0) {
    res.status(404);
    throw new Error('Evento asociado no encontrado');
  }

  const event = events[0];

  // Verificar permisos
  const isOperator = event.operators.some(op => 
    op.user.toString() === req.user._id.toString() && 
    (op.role === 'general' || op.role === 'activity' || op.role === 'assistant') &&
    (op.role !== 'activity' || !op.activities || op.activities.some(a => a.toString() === activity._id.toString()))
  );
  
  if (req.user.role !== 'admin' && !isOperator) {
    res.status(403);
    throw new Error('No tienes permiso para eliminar testigos de esta actividad');
  }

  // Verificar que el usuario es un testigo de la actividad
  const witnessIndex = activity.witnesses.findIndex(w => w.toString() === req.params.userId);
  
  if (witnessIndex === -1) {
    res.status(404);
    throw new Error('Testigo no encontrado');
  }

  // Eliminar el testigo
  activity.witnesses.splice(witnessIndex, 1);

  // Actualizar información de cambios
  activity.changedDate = Date.now();
  activity.changedBy = req.user._id;
  activity.changedType = 'update';
  activity.changedHistory.push({
    date: new Date(),
    user: req.user._id,
    changeType: 'remove-witness'
  });

  const updatedActivity = await activity.save();

  res.json({
    message: 'Testigo eliminado correctamente',
    witnesses: updatedActivity.witnesses
  });
});

// @desc    Incrementar asientos ocupados en una actividad
// @route   PUT /api/activities/:id/seats/increment
// @access  Private
const incrementTakenSeats = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  
  if (!activity || activity.isDeleted) {
    res.status(404);
    throw new Error('Actividad no encontrada');
  }

  // Verificar disponibilidad
  if (activity.seats > 0 && activity.takenSeats >= activity.seats) {
    res.status(400);
    throw new Error('No hay asientos disponibles para esta actividad');
  }

  // Incrementar asientos ocupados
  activity.takenSeats += 1;

  // Guardar cambios
  const updatedActivity = await activity.save();

  res.json({
    message: 'Asiento reservado correctamente',
    takenSeats: updatedActivity.takenSeats,
    availableSeats: updatedActivity.seats > 0 ? updatedActivity.seats - updatedActivity.takenSeats : 'ilimitados'
  });
});

// @desc    Decrementar asientos ocupados en una actividad
// @route   PUT /api/activities/:id/seats/decrement
// @access  Private
const decrementTakenSeats = asyncHandler(async (req, res) => {
  const activity = await Activity.findById(req.params.id);
  
  if (!activity || activity.isDeleted) {
    res.status(404);
    throw new Error('Actividad no encontrada');
  }

  // Verificar que haya asientos ocupados
  if (activity.takenSeats <= 0) {
    res.status(400);
    throw new Error('No hay asientos ocupados para liberar');
  }

  // Decrementar asientos ocupados
  activity.takenSeats -= 1;

  // Guardar cambios
  const updatedActivity = await activity.save();

  res.json({
    message: 'Asiento liberado correctamente',
    takenSeats: updatedActivity.takenSeats,
    availableSeats: updatedActivity.seats > 0 ? updatedActivity.seats - updatedActivity.takenSeats : 'ilimitados'
  });
});

module.exports = {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
  addWitness,
  removeWitness,
  incrementTakenSeats,
  decrementTakenSeats
};