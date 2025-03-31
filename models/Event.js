const mongoose = require('mongoose');

const eventSchema = mongoose.Schema(
  {
    logo: {
      type: String, // URL de la imagen almacenada en Cloudinary
      default: ''
    },
    mainImage: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      required: [true, 'Por favor ingrese un título para el evento'],
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
    activities: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Activity'
    }],
    califications: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Calification'
    }],
    witnesses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Witness'
    }],
    assistants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    operators: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      role: {
        type: String,
        enum: ['general', 'activity', 'assistant'],
        default: 'general'
      },
      activities: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Activity'
      }]
    }],
    place: {
      type: String,
      trim: true
    },
    dateStart: {
      type: Date
    },
    timeStart: {
      type: String
    },
    dateEnd: {
      type: Date
    },
    timeEnd: {
      type: String
    },
    isPublic: {
      type: Boolean,
      default: true
    },
    photos: [{
      type: String // URLs de Cloudinary
    }],
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

// Virtual para obtener el promedio de calificaciones
eventSchema.virtual('averageRating').get(function() {
  if (this.califications && this.califications.length > 0) {
    // Este cálculo asume que las calificaciones ya están disponibles y no como referencias
    // En la implementación real, esto se manejaría a través de una consulta agregada o populate
    return 0;
  }
  return 0;
});

module.exports = mongoose.model('Event', eventSchema);