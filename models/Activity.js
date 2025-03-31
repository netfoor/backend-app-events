const mongoose = require('mongoose');

const activitySchema = mongoose.Schema(
  {
    ticketType: {
      type: Number,
      default: 0 // 0 = libre, 1 = pago, etc.
    },
    title: {
      type: String,
      required: [true, 'Por favor ingrese un título para la actividad'],
      trim: true
    },
    subtitle: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    organization: {
      type: String,
      trim: true
    },
    califications: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Calification'
    }],
    witnesses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Witness'
    }],
    date: {
      type: Date
    },
    time: {
      type: String
    },
    place: {
      type: String,
      trim: true
    },
    infoColor: {
      type: String,
      default: '#000000'
    },
    bgColor: {
      type: String,
      default: '#FFFFFF'
    },
    starColor: {
      type: String,
      default: '#FFD700'
    },
    seats: {
      type: Number,
      default: 0 // 0 = ilimitados
    },
    takenSeats: {
      type: Number,
      default: 0
    },
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

// Virtual para verificar disponibilidad
activitySchema.virtual('isAvailable').get(function() {
  if (this.seats === 0) return true; // Asientos ilimitados
  return this.takenSeats < this.seats;
});

// Virtual para obtener el promedio de calificaciones
activitySchema.virtual('averageRating').get(function() {
  if (this.califications && this.califications.length > 0) {
    // Este cálculo asume que las calificaciones ya están disponibles y no como referencias
    return 0;
  }
  return 0;
});

module.exports = mongoose.model('Activity', activitySchema);