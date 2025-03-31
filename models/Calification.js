const mongoose = require('mongoose');

const calificationSchema = mongoose.Schema(
  {
    calificator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'La calificación debe estar asociada a un usuario']
    },
    rating: {
      type: Number,
      required: [true, 'Por favor ingrese una calificación'],
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    // Referencia al modelo que se está calificando (Event o Activity)
    target: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'targetModel',
      required: true
    },
    targetModel: {
      type: String,
      required: true,
      enum: ['Event', 'Activity']
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Calification', calificationSchema);