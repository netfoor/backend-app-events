const asyncHandler = require('express-async-handler');
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const Event = require('../models/Event');
const Activity = require('../models/Activity');

// @desc    Crear un nuevo ticket
// @route   POST /api/tickets
// @access  Private/Admin o Operator
const createTicket = asyncHandler(async (req, res) => {
  const { 
    type, title, event, role, price, 
    description, user: targetUser, activities 
  } = req.body;

  // Validaciones básicas
  if (!title || !event || !targetUser) {
    res.status(400);
    throw new Error('El título, evento y usuario son requeridos');
  }

  // Verificar que el evento existe
  const eventExists = await Event.findById(event);
  if (!eventExists || eventExists.isDeleted) {
    res.status(404);
    throw new Error('Evento no encontrado');
  }

  // Verificar permisos
  const isOperator = eventExists.operators.some(op => 
    op.user.toString() === req.user._id.toString() && 
    (op.role === 'general' || op.role === 'assistant')
  );
  
  if (req.user.role !== 'admin' && !isOperator) {
    res.status(403);
    throw new Error('No tienes permiso para crear tickets para este evento');
  }

  // Verificar que el usuario destino existe
  const userExists = await User.findById(targetUser);
  if (!userExists || userExists.isDeleted) {
    res.status(404);
    throw new Error('Usuario no encontrado');
  }

  // Verificar actividades si se proporcionan
  if (activities && activities.length > 0) {
    const validActivities = await Activity.find({
      _id: { $in: activities },
      isDeleted: false
    });

    if (validActivities.length !== activities.length) {
      res.status(400);
      throw new Error('Una o más actividades no son válidas');
    }

    // Verificar disponibilidad de asientos
    for (const activity of validActivities) {
      if (activity.seats > 0 && activity.takenSeats >= activity.seats) {
        res.status(400);
        throw new Error(`No hay asientos disponibles para la actividad: ${activity.title}`);
      }
    }

    // Incrementar asientos ocupados
    for (const activity of validActivities) {
      if (activity.seats > 0) {
        activity.takenSeats += 1;
        await activity.save();
      }
    }
  }

  // Crear el ticket
  const ticket = await Ticket.create({
    type: type || 0,
    title,
    event,
    role: role || 'assistente',
    price: price || 0,
    description,
    user: targetUser,
    activities: activities || [],
    createdAt: Date.now(),
    changedBy: req.user._id,
    changedType: 'create',
    changedHistory: [{
      date: new Date(),
      user: req.user._id,
      changeType: 'create'
    }]
  });

  if (ticket) {
    // Agregar el ticket al usuario
    await User.findByIdAndUpdate(targetUser, {
      $push: { tickets: ticket._id }
    });

    // Agregar el usuario como asistente al evento si no lo es ya
    if (!eventExists.assistants.includes(targetUser)) {
      eventExists.assistants.push(targetUser);
      await eventExists.save();
    }

    res.status(201).json(ticket);
  } else {
    res.status(400);
    throw new Error('Datos de ticket inválidos');
  }
});

// @desc    Obtener todos los tickets
// @route   GET /api/tickets
// @access  Private/Admin
const getTickets = asyncHandler(async (req, res) => {
  // Para administradores, todos los tickets
  if (req.user.role === 'admin') {
    const tickets = await Ticket.find({ isDeleted: false })
      .populate('user', 'name email')
      .populate('event', 'title')
      .populate('activities', 'title');
    
    return res.json(tickets);
  }

  // Para operadores, tickets de los eventos donde son operadores
  const operatedEvents = await Event.find({
    'operators.user': req.user._id,
    isDeleted: false
  });

  const operatedEventIds = operatedEvents.map(event => event._id);

  const tickets = await Ticket.find({
    event: { $in: operatedEventIds },
    isDeleted: false
  })
    .populate('user', 'name email')
    .populate('event', 'title')
    .populate('activities', 'title');

  res.json(tickets);
});

// @desc    Obtener tickets de un usuario
// @route   GET /api/tickets/user/:userId
// @access  Private
const getUserTickets = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  // Un usuario solo puede ver sus propios tickets a menos que sea admin o un operador autorizado
  if (userId !== req.user._id.toString() && req.user.role !== 'admin') {
    // Verificar si es operador de algún evento al que pertenecen los tickets
    const tickets = await Ticket.find({
      user: userId,
      isDeleted: false
    });

    const eventIds = [...new Set(tickets.map(ticket => ticket.event.toString()))];

    const hasPermission = await Event.exists({
      _id: { $in: eventIds },
      'operators.user': req.user._id,
      isDeleted: false
    });

    if (!hasPermission) {
      res.status(403);
      throw new Error('No tienes permiso para ver los tickets de este usuario');
    }
  }

  const tickets = await Ticket.find({
    user: userId,
    isDeleted: false
  })
    .populate('event', 'title')
    .populate('activities', 'title');

  res.json(tickets);
});

// @desc    Obtener tickets de un evento
// @route   GET /api/tickets/event/:eventId
// @access  Private/Admin o Operator
const getEventTickets = asyncHandler(async (req, res) => {
  const eventId = req.params.eventId;

  // Verificar que el evento existe
  const event = await Event.findById(eventId);
  if (!event || event.isDeleted) {
    res.status(404);
    throw new Error('Evento no encontrado');
  }

  // Verificar permisos
  const isOperator = event.operators.some(op => 
    op.user.toString() === req.user._id.toString()
  );
  
  if (req.user.role !== 'admin' && !isOperator) {
    res.status(403);
    throw new Error('No tienes permiso para ver los tickets de este evento');
  }

  const tickets = await Ticket.find({
    event: eventId,
    isDeleted: false
  })
    .populate('user', 'name email')
    .populate('activities', 'title');

  res.json(tickets);
});

// @desc    Obtener un ticket por ID
// @route   GET /api/tickets/:id
// @access  Private
const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id)
    .populate('user', 'name email')
    .populate('event', 'title')
    .populate('activities', 'title');

  if (!ticket || ticket.isDeleted) {
    res.status(404);
    throw new Error('Ticket no encontrado');
  }

  // Verificar permisos
  const isOwner = ticket.user._id.toString() === req.user._id.toString();
  
  if (!isOwner && req.user.role !== 'admin') {
    // Verificar si es operador del evento
    const event = await Event.findById(ticket.event);
    const isOperator = event.operators.some(op => 
      op.user.toString() === req.user._id.toString()
    );
    
    if (!isOperator) {
      res.status(403);
      throw new Error('No tienes permiso para ver este ticket');
    }
  }

  res.json(ticket);
});

// @desc    Actualizar un ticket
// @route   PUT /api/tickets/:id
// @access  Private/Admin o Operator
const updateTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket || ticket.isDeleted) {
    res.status(404);
    throw new Error('Ticket no encontrado');
  }

  // Verificar permisos
  if (req.user.role !== 'admin') {
    const event = await Event.findById(ticket.event);
    const isOperator = event.operators.some(op => 
      op.user.toString() === req.user._id.toString() && 
      (op.role === 'general' || op.role === 'assistant')
    );
    
    if (!isOperator) {
      res.status(403);
      throw new Error('No tienes permiso para actualizar este ticket');
    }
  }

  // Manejar cambios en actividades
  if (req.body.activities) {
    const oldActivities = ticket.activities.map(a => a.toString());
    const newActivities = req.body.activities;
    
    // Actividades eliminadas
    const removedActivities = oldActivities.filter(a => !newActivities.includes(a));
    if (removedActivities.length > 0) {
      // Liberar asientos
      for (const activityId of removedActivities) {
        const activity = await Activity.findById(activityId);
        if (activity && activity.seats > 0 && activity.takenSeats > 0) {
          activity.takenSeats -= 1;
          await activity.save();
        }
      }
    }
    
    // Actividades añadidas
    const addedActivities = newActivities.filter(a => !oldActivities.includes(a));
    if (addedActivities.length > 0) {
      const validActivities = await Activity.find({
        _id: { $in: addedActivities },
        isDeleted: false
      });

      if (validActivities.length !== addedActivities.length) {
        res.status(400);
        throw new Error('Una o más actividades nuevas no son válidas');
      }

      // Verificar y reservar asientos
      for (const activity of validActivities) {
        if (activity.seats > 0) {
          if (activity.takenSeats >= activity.seats) {
            res.status(400);
            throw new Error(`No hay asientos disponibles para la actividad: ${activity.title}`);
          }
          activity.takenSeats += 1;
          await activity.save();
        }
      }
    }
  }

  // Actualizar campos
  ticket.title = req.body.title || ticket.title;
  if (req.body.type !== undefined) ticket.type = req.body.type;
  if (req.body.role) ticket.role = req.body.role;
  if (req.body.price !== undefined) ticket.price = req.body.price;
  ticket.description = req.body.description !== undefined ? req.body.description : ticket.description;
  if (req.body.activities) ticket.activities = req.body.activities;

  // Actualizar información de cambios
  ticket.changedDate = Date.now();
  ticket.changedBy = req.user._id;
  ticket.changedType = 'update';
  ticket.changedHistory.push({
    date: new Date(),
    user: req.user._id,
    changeType: 'update'
  });

  const updatedTicket = await ticket.save();
  
  // Obtener ticket con referencias pobladas
  const populatedTicket = await Ticket.findById(updatedTicket._id)
    .populate('user', 'name email')
    .populate('event', 'title')
    .populate('activities', 'title');

  res.json(populatedTicket);
});

// @desc    Eliminar un ticket
// @route   DELETE /api/tickets/:id
// @access  Private/Admin
const deleteTicket = asyncHandler(async (req, res) => {
  const ticket = await Ticket.findById(req.params.id);

  if (!ticket || ticket.isDeleted) {
    res.status(404);
    throw new Error('Ticket no encontrado');
  }

  // Solo administradores pueden eliminar tickets
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('No tienes permiso para eliminar tickets');
  }

  // Liberar asientos en actividades
  for (const activityId of ticket.activities) {
    const activity = await Activity.findById(activityId);
    if (activity && activity.seats > 0 && activity.takenSeats > 0) {
      activity.takenSeats -= 1;
      await activity.save();
    }
  }

  // Marcar como eliminado en lugar de eliminar físicamente
  ticket.isDeleted = true;
  ticket.changedDate = Date.now();
  ticket.changedBy = req.user._id;
  ticket.changedType = 'delete';
  ticket.changedHistory.push({
    date: new Date(),
    user: req.user._id,
    changeType: 'delete'
  });

  await ticket.save();

  // Eliminar la referencia en el usuario
  await User.findByIdAndUpdate(ticket.user, {
    $pull: { tickets: ticket._id }
  });

  res.json({ message: 'Ticket eliminado' });
});

module.exports = {
  createTicket,
  getTickets,
  getUserTickets,
  getEventTickets,
  getTicketById,
  updateTicket,
  deleteTicket
};