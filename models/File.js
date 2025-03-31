const mongoose = require('mongoose');

const fileSchema = mongoose.Schema(
  {
    location: {
      type: String, // URL de Cloudinary
      required: [true, 'La ubicación del archivo es requerida']
    },
    title: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ['image', 'document', 'video', 'other'],
      default: 'image'
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El archivo debe estar asociado a un usuario']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    // Referencia al modelo al que está asociado este archivo (Event, Activity, User)
    target: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'targetModel',
      required: false // Puede no estar asociado a ninguna entidad específica
    },
    targetModel: {
      type: String,
      enum: ['Event', 'Activity', 'User', null],
      default: null
    },
    publicId: {
      type: String, // ID público de Cloudinary para facilitar eliminación
      required: true
    },
    size: {
      type: Number, // Tamaño en bytes
      default: 0
    },
    format: {
      type: String // jpg, png, pdf, etc.
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('File', fileSchema);