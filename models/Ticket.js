const mongoose = require('mongoose');

const ticketSchema = mongoose.Schema(
  {
    type: {
      type: Number,
      required: [true, 'Por favor especifique el tipo de ticket'],
      default: 0 // 0 = gratuito, 1 = pago, etc.
    },
    title: {
      type: String,
      required: [true, 'Por favor ingrese un título para el ticket'],
      trim: true
    },
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'El ticket debe estar asociado a un evento']
    },
    role: {
      type: String,
      enum: ['assistente', 'operador', 'administrador'],
      default: 'assistente'
    },
    price: {
      type: Number,
      default: 0
    },
    description: {
      type: String,
      trim: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El ticket debe estar asociado a un usuario']
    },
    activities: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity'
    }],
    createdAt: {
      type: Date,
      default: Date.now
    },
    changedDate: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changedType: {
      type: String,
      enum: ['create', 'update', 'delete'],
      default: 'create'
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    changedHistory: [{
      date: Date,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      changeType: String
    }]
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Ticket', ticketSchema);