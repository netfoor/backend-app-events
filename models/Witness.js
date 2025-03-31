const mongoose = require('mongoose');

const witnessSchema = mongoose.Schema(
  {
    witness: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El testigo debe estar asociado a un usuario']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    // Referencia al modelo al que está asociado este testigo (Event o Activity)
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

module.exports = mongoose.model('Witness', witnessSchema);