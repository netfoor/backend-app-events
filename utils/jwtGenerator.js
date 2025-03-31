const jwt = require('jsonwebtoken');

// Generar token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Token válido por 30 días
  });
};

// Generar token para reseteo de contraseña (válido por menos tiempo)
const generatePasswordResetToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1h', // Token válido por 1 hora
  });
};

// Generar token para verificación de email
const generateEmailVerificationToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d', // Token válido por 7 días
  });
};

module.exports = {
  generateToken,
  generatePasswordResetToken,
  generateEmailVerificationToken
};