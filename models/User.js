const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Por favor ingrese un nombre'],
      trim: true
    },
    role: {
      type: String,
      enum: ['admin', 'operator', 'user'],
      default: 'user'
    },
    permissions: {
      isAssistant: {
        type: Boolean,
        default: false
      },
      isOperator: {
        type: Boolean,
        default: false
      }
    },
    tickets: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket'
    }],
    email: {
      type: String,
      required: [true, 'Por favor ingrese un email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Por favor ingrese un email válido']
    },
    phone: {
      type: String,
      trim: true
    },
    lastSession: {
      type: Date,
      default: Date.now
    },
    password: {
      type: String,
      required: [true, 'Por favor ingrese una contraseña'],
      minlength: [6, 'La contraseña debe tener al menos 6 caracteres']
    },
    verified: {
      type: Boolean,
      default: false
    },
    isDeleted: {
      type: Boolean,
      default: false
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
    verifyNumber: {
      type: Number
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

// Middleware para encriptar la contraseña antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Método para verificar si la contraseña coincide
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);