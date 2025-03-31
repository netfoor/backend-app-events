const asyncHandler = require('express-async-handler');
const Calification = require('../models/Calification');
const Event = require('../models/Event');
const Activity = require('../models/Activity');

// @desc    Crear una calificación para un evento o actividad
// @route   POST /api/califications
// @access  Private
const createCalification = asyncHandler(async (req, res) => {
  const { rating, comment, target, targetModel } = req.body;

  // Validaciones básicas
  if (!rating || !target || !targetModel) {
    res.status(400);
    throw new Error('La calificación, el objetivo y el tipo de objetivo son requeridos');
  }

  if (rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('La calificación debe estar entre 1 y 5');
  }

  if (!['Event', 'Activity'].includes(targetModel)) {
    res.status(400);
    throw new Error('El tipo de objetivo debe ser Event o Activity');
  }

  // Verificar que el objetivo existe
  let targetExists;
  if (targetModel === 'Event') {
    targetExists = await Event.findById(target);
  } else {
    targetExists = await Activity.findById(target);
  }

  if (!targetExists || targetExists.isDeleted) {
    res.status(404);
    throw new Error(`${targetModel === 'Event' ? 'Evento' : 'Actividad'} no encontrado`);
  }

  // Verificar que el usuario puede calificar (debe ser asistente o testigo)
  let canRate = false;

  if (targetModel === 'Event') {
    // Para eventos, verificar si es asistente
    canRate = targetExists.assistants.some(a => a.toString() === req.user._id.toString());
  } else {
    // Para actividades, verificar si es testigo
    canRate = targetExists.witnesses.some(w => w.toString() === req.user._id.toString());
    
    if (!canRate) {
      // Si no es testigo directo, verificar en el evento relacionado
      const relatedEvents = await Event.find({ 
        activities: targetExists._id,
        assistants: req.user._id,
        isDeleted: false
      });
      
      canRate = relatedEvents.length > 0;
    }
  }

  if (!canRate && req.user.role !== 'admin') {
    res.status(403);
    throw new Error(`No puedes calificar este ${targetModel === 'Event' ? 'evento' : 'actividad'} porque no eres participante`);
  }

  // Verificar si el usuario ya ha calificado este objetivo
  const existingCalification = await Calification.findOne({
    calificator: req.user._id,
    target,
    targetModel
  });

  if (existingCalification) {
    res.status(400);
    throw new Error(`Ya has calificado este ${targetModel === 'Event' ? 'evento' : 'actividad'}`);
  }

  // Crear la calificación
  const calification = await Calification.create({
    calificator: req.user._id,
    rating,
    comment,
    target,
    targetModel,
    createdAt: Date.now()
  });

  if (calification) {
    // Agregar la calificación al objetivo
    if (targetModel === 'Event') {
      await Event.findByIdAndUpdate(target, {
        $push: { califications: calification._id }
      });
    } else {
      await Activity.findByIdAndUpdate(target, {
        $push: { califications: calification._id }
      });
    }

    res.status(201).json(calification);
  } else {
    res.status(400);
    throw new Error('Datos de calificación inválidos');
  }
});

// @desc    Obtener calificaciones para un objetivo específico (evento o actividad)
// @route   GET /api/califications/:targetModel/:targetId
// @access  Public
const getCalifications = asyncHandler(async (req, res) => {
  const { targetModel, targetId } = req.params;

  if (!['Event', 'Activity'].includes(targetModel)) {
    res.status(400);
    throw new Error('El tipo de objetivo debe ser Event o Activity');
  }

  // Verificar que el objetivo existe
  let targetExists;
  if (targetModel === 'Event') {
    targetExists = await Event.findById(targetId);
  } else {
    targetExists = await Activity.findById(targetId);
  }

  if (!targetExists || targetExists.isDeleted) {
    res.status(404);
    throw new Error(`${targetModel === 'Event' ? 'Evento' : 'Actividad'} no encontrado`);
  }

  // Verificar permisos para ver calificaciones si el objetivo no es público
  if (targetModel === 'Event' && !targetExists.isPublic) {
    const canView = req.user && (
      req.user.role === 'admin' || 
      targetExists.assistants.some(a => a.toString() === req.user._id.toString()) ||
      targetExists.operators.some(op => op.user.toString() === req.user._id.toString())
    );

    if (!canView) {
      res.status(403);
      throw new Error('No tienes permiso para ver las calificaciones de este evento');
    }
  }

  // Obtener calificaciones
  const califications = await Calification.find({
    target: targetId,
    targetModel
  }).populate('calificator', 'name');

  // Calcular promedio
  const totalRatings = califications.length;
  const averageRating = totalRatings > 0 
    ? califications.reduce((sum, cal) => sum + cal.rating, 0) / totalRatings 
    : 0;

  res.json({
    califications,
    stats: {
      totalRatings,
      averageRating: parseFloat(averageRating.toFixed(1))
    }
  });
});

// @desc    Actualizar una calificación
// @route   PUT /api/califications/:id
// @access  Private
const updateCalification = asyncHandler(async (req, res) => {
  const calification = await Calification.findById(req.params.id);

  if (!calification) {
    res.status(404);
    throw new Error('Calificación no encontrada');
  }

  // Verificar que el usuario es el dueño de la calificación o es admin
  if (calification.calificator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('No tienes permiso para actualizar esta calificación');
  }

  // Validar rating si se proporciona
  if (req.body.rating && (req.body.rating < 1 || req.body.rating > 5)) {
    res.status(400);
    throw new Error('La calificación debe estar entre 1 y 5');
  }

  // Actualizar campos
  calification.rating = req.body.rating || calification.rating;
  calification.comment = req.body.comment !== undefined ? req.body.comment : calification.comment;

  const updatedCalification = await calification.save();
  res.json(updatedCalification);
});

// @desc    Eliminar una calificación
// @route   DELETE /api/califications/:id
// @access  Private
const deleteCalification = asyncHandler(async (req, res) => {
  const calification = await Calification.findById(req.params.id);

  if (!calification) {
    res.status(404);
    throw new Error('Calificación no encontrada');
  }

  // Verificar que el usuario es el dueño de la calificación o es admin
  if (calification.calificator.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('No tienes permiso para eliminar esta calificación');
  }

  // Eliminar la calificación
  await calification.remove();

  // Eliminar la referencia en el objetivo
  if (calification.targetModel === 'Event') {
    await Event.findByIdAndUpdate(calification.target, {
      $pull: { califications: calification._id }
    });
  } else {
    await Activity.findByIdAndUpdate(calification.target, {
      $pull: { califications: calification._id }
    });
  }

  res.json({ message: 'Calificación eliminada' });
});

// @desc    Obtener una calificación específica
// @route   GET /api/califications/:id
// @access  Public o Private dependiendo del objetivo
const getCalificationById = asyncHandler(async (req, res) => {
  const calification = await Calification.findById(req.params.id)
    .populate('calificator', 'name');

  if (!calification) {
    res.status(404);
    throw new Error('Calificación no encontrada');
  }

  // Verificar permisos si el objetivo es un evento no público
  if (calification.targetModel === 'Event') {
    const event = await Event.findById(calification.target);
    
    if (event && !event.isPublic && (!req.user || (req.user.role !== 'admin' && 
        !event.assistants.some(a => a.toString() === req.user._id.toString()) && 
        !event.operators.some(op => op.user.toString() === req.user._id.toString())))) {
      res.status(403);
      throw new Error('No tienes permiso para ver esta calificación');
    }
  }

  res.json(calification);
});

module.exports = {
  createCalification,
  getCalifications,
  updateCalification,
  deleteCalification,
  getCalificationById
};