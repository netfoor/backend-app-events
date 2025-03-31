const mongoose = require('mongoose');

const mainSchema = mongoose.Schema(
  {
    logo: {
      type: String, // URL de Cloudinary
      default: ''
    },
    title: {
      type: String,
      required: [true, 'Por favor ingrese un título para la aplicación'],
      trim: true,
      default: 'Event App'
    },
    subtitle: {
      type: String,
      trim: true,
      default: 'Gestión de eventos'
    },
    welcome: {
      type: String,
      trim: true,
      default: 'Bienvenido a Event App'
    },
    infoColor: {
      type: String,
      default: '#000000'
    },
    bgColor: {
      type: String,
      default: '#FFFFFF'
    },
    linkColor: {
      type: String,
      default: '#0000FF'
    },
    btnColor: {
      type: String,
      default: '#007BFF'
    },
    secColor: {
      type: String,
      default: '#6C757D'
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
    company: {
      type: String,
      trim: true,
      default: 'Mi Empresa'
    },
    infoMail: {
      type: String,
      trim: true,
      default: 'info@miempresa.com'
    },
    infoPhone: {
      type: String,
      trim: true,
      default: '+1234567890'
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

module.exports = mongoose.model('Main', mainSchema);