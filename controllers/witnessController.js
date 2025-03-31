const asyncHandler = require('express-async-handler');
const Witness = require('../models/Witness');
const Event = require('../models/Event');
const Activity = require('../models/Activity');
const User = require('../models/User');

// @desc    Crear un nuevo testigo (asistente a evento o actividad)
// @route   POST /api/witnesses
// @access  Private/Admin o Operator
const createWitness = asyncHandler(async (req, res) => {
  const { witness: userId, target, targetModel } = req.body;

  // Validaciones básicas
  if (!userId || !target || !targetModel) {
    res.status(400);
    throw new Error('El usuario, objetivo y tipo de objetivo son requeridos');
  }

  if (!['Event', 'Activity'].includes(targetModel)) {
    res.status(400);
    throw new Error('El tipo de objetivo debe ser Event o Activity');
  }

  // Verificar que el usuario existe
  const user = await User.findById(userId);
  if (!user || user.isDeleted) {
    res.status(404);
    throw new Error('Usuario no encontrado');
  }

  // Verificar que el objetivo existe y permisos
  let targetObj;
  let isOperator = false;

  if (targetModel === 'Event') {
    targetObj = await Event.findById(target);
    if (!targetObj || targetObj.isDeleted) {
      res.status(404);
      throw new Error('Evento no encontrado');
    }

    // Verificar permisos
    isOperator = targetObj.operators.some(op => 
      op.user.toString() === req.user._id.toString() && 
      (op.role === 'general' || op.role === 'assistant')
    );
  } else { // Activity
    targetObj = await Activity.findById(target);
    if (!targetObj || targetObj.isDeleted) {
      res.status(404);
      throw new Error('Actividad no encontrada');
    }

    // Para actividades, verificar en el evento relacionado
    const relatedEvents = await Event.find({ 
      activities: targetObj._id,
      isDeleted: false
    });
    
    if (relatedEvents.length === 0) {
      res.status(404);
      throw new Error('Evento relacionado no encontrado');
    }

    const event = relatedEvents[0];
    
    // Verificar permisos
    isOperator = event.operators.some(op => 
      op.user.toString() === req.user._id.toString() && 
      (op.role === 'general' || op.role === 'assistant' || 
       (op.role === 'activity' && op.activities && op.activities.some(a => a.toString() === targetObj._id.toString())))
    );
  }

  // Solo admin u operadores autorizados pueden crear testigos
  if (req.user.role !== 'admin' && !isOperator) {
    res.status(403);
    throw new Error(`No tienes permiso para agregar testigos a este ${targetModel === 'Event' ? 'evento' : 'actividad'}`);
  }

  // Verificar si ya existe un testigo para este usuario y objetivo
  const witnessExists = await Witness.findOne({
    witness: userId,
    target,
    targetModel
  });

  if (witnessExists) {
    res.status(400);
    throw new Error(`Este usuario ya es testigo de este ${targetModel === 'Event' ? 'evento' : 'actividad'}`);
  }

  // Crear el testigo
  const witnessRecord = await Witness.create({
    witness: userId,
    target,
    targetModel,
    createdAt: Date.now()
  });

  if (witnessRecord) {
    // Agregar referencia al objetivo
    if (targetModel === 'Event') {
      await Event.findByIdAndUpdate(target, {
        $push: { witnesses: witnessRecord._id }
      });
    } else {
      await Activity.findByIdAndUpdate(target, {
        $push: { witnesses: witnessRecord._id }
      });
    }

    res.status(201).json(witnessRecord);
  } else {
    res.status(400);
    throw new Error('Error al crear el testigo');
  }
});

// @desc    Obtener todos los testigos
// @route   GET /api/witnesses
// @access  Private/Admin
const getWitnesses = asyncHandler(async (req, res) => {
  // Solo administradores pueden ver todos los testigos
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Acceso denegado');
  }

  const witnesses = await Witness.find()
    .populate('witness', 'name email')
    .sort({ createdAt: -1 });

  res.json(witnesses);
});

// @desc    Obtener testigos por objetivo
// @route   GET /api/witnesses/:targetModel/:targetId
// @access  Private/Admin o Operator
const getWitnessesByTarget = asyncHandler(async (req, res) => {
  const { targetModel, targetId } = req.params;

  // Validar modelo objetivo
  if (!['Event', 'Activity'].includes(targetModel)) {
    res.status(400);
    throw new Error('El tipo de objetivo debe ser Event o Activity');
  }

  // Verificar que el objetivo existe y permisos
  let isOperator = false;

  if (targetModel === 'Event') {
    const event = await Event.findById(targetId);
    if (!event || event.isDeleted) {
      res.status(404);
      throw new Error('Evento no encontrado');
    }

    // Verificar permisos
    isOperator = event.operators.some(op => 
      op.user.toString() === req.user._id.toString()
    );
  } else { // Activity
    const activity = await Activity.findById(targetId);
    if (!activity || activity.isDeleted) {
      res.status(404);
      throw new Error('Actividad no encontrada');
    }

    // Para actividades, verificar en el evento relacionado
    const relatedEvents = await Event.find({ 
      activities: activity._id,
      isDeleted: false
    });
    
    if (relatedEvents.length === 0) {
      res.status(404);
      throw new Error('Evento relacionado no encontrado');
    }

    const event = relatedEvents[0];
    
    // Verificar permisos
    isOperator = event.operators.some(op => 
      op.user.toString() === req.user._id.toString()
    );
  }

  // Solo admin u operadores autorizados pueden ver testigos
  if (req.user.role !== 'admin' && !isOperator) {
    res.status(403);
    throw new Error(`No tienes permiso para ver los testigos de este ${targetModel === 'Event' ? 'evento' : 'actividad'}`);
  }

  const witnesses = await Witness.find({
    target: targetId,
    targetModel
  })
    .populate('witness', 'name email')
    .sort({ createdAt: -1 });

  res.json(witnesses);
});

// @desc    Obtener testigos por usuario
// @route   GET /api/witnesses/user/:userId
// @access  Private
const getWitnessesByUser = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  // Un usuario solo puede ver sus propios testigos a menos que sea admin
  if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('No tienes permiso para ver los testigos de este usuario');
  }

  const witnesses = await Witness.find({ witness: userId })
    .sort({ createdAt: -1 });

  res.json(witnesses);
});

// @desc    Eliminar un testigo
// @route   DELETE /api/witnesses/:id
// @access  Private/Admin o Operator
const deleteWitness = asyncHandler(async (req, res) => {
  const witness = await Witness.findById(req.params.id);

  if (!witness) {
    res.status(404);
    throw new Error('Testigo no encontrado');
  }

  // Verificar permisos
  let isOperator = false;

  if (witness.targetModel === 'Event') {
    const event = await Event.findById(witness.target);
    if (!event || event.isDeleted) {
      res.status(404);
      throw new Error('Evento no encontrado');
    }

    // Verificar permisos
    isOperator = event.operators.some(op => 
      op.user.toString() === req.user._id.toString() && 
      (op.role === 'general' || op.role === 'assistant')
    );
  } else { // Activity
    const activity = await Activity.findById(witness.target);
    if (!activity || activity.isDeleted) {
      res.status(404);
      throw new Error('Actividad no encontrada');
    }

    // Para actividades, verificar en el evento relacionado
    const relatedEvents = await Event.find({ 
      activities: activity._id,
      isDeleted: false
    });
    
    if (relatedEvents.length === 0) {
      res.status(404);
      throw new Error('Evento relacionado no encontrado');
    }

    const event = relatedEvents[0];
    
    // Verificar permisos
    isOperator = event.operators.some(op => 
      op.user.toString() === req.user._id.toString() && 
      (op.role === 'general' || op.role === 'assistant' || 
       (op.role === 'activity' && op.activities && op.activities.some(a => a.toString() === activity._id.toString())))
    );
  }

  // Solo admin u operadores autorizados pueden eliminar testigos
  if (req.user.role !== 'admin' && !isOperator) {
    res.status(403);
    throw new Error(`No tienes permiso para eliminar testigos de este ${witness.targetModel === 'Event' ? 'evento' : 'actividad'}`);
  }

  // Eliminar referencia en el objetivo
  if (witness.targetModel === 'Event') {
    await Event.findByIdAndUpdate(witness.target, {
      $pull: { witnesses: witness._id }
    });
  } else {
    await Activity.findByIdAndUpdate(witness.target, {
      $pull: { witnesses: witness._id }
    });
  }

  // Eliminar el testigo
  await witness.remove();

  res.json({ message: 'Testigo eliminado' });
});

module.exports = {
  createWitness,
  getWitnesses,
  getWitnessesByTarget,
  getWitnessesByUser,
  deleteWitness
};