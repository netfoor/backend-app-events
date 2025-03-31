const validator = require('validator');

// Validar email
const isValidEmail = (email) => {
  return validator.isEmail(email);
};

// Validar URL
const isValidURL = (url) => {
  return validator.isURL(url);
};

// Validar contraseña segura (mínimo 6 caracteres, al menos una letra y un número)
const isStrongPassword = (password) => {
  return validator.isStrongPassword(password, {
    minLength: 6,
    minLowercase: 1,
    minUppercase: 0,
    minNumbers: 1,
    minSymbols: 0
  });
};

// Validar que la fecha sea posterior a hoy
const isFutureDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) >= today;
};

// Validar que un string no esté vacío
const isNotEmpty = (str) => {
  return !validator.isEmpty(str.trim());
};

// Validar color hexadecimal
const isHexColor = (color) => {
  return validator.isHexColor(color);
};

// Validar tipo de archivo
const isValidFileType = (mimetype, allowedTypes) => {
  return allowedTypes.includes(mimetype);
};

module.exports = {
  isValidEmail,
  isValidURL,
  isStrongPassword,
  isFutureDate,
  isNotEmpty,
  isHexColor,
  isValidFileType
};