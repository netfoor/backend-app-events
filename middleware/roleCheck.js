const asyncHandler = require('express-async-handler');

// Middleware para verificar roles específicos
const checkRole = (roles) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      res.status(401);
      throw new Error('No autenticado');
    }

    const hasRole = roles.find(role => req.user.role === role);
    
    if (!hasRole) {
      res.status(403);
      throw new Error(`Acceso denegado. Roles requeridos: ${roles.join(', ')}`);
    }

    next();
  });
};

// Middleware para verificar permisos en actividades
const checkActivityOperator = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error('No autenticado');
  }

  // Si es admin, siempre tiene acceso
  if (req.user.role === 'admin') {
    return next();
  }

  // Verificar si es operador de la actividad específica
  // Esto requeriría verificar en la base de datos si el usuario tiene permiso para la actividad específica
  // Por ahora, implementación básica
  if (req.user.role === 'operator') {
    // Aquí se implementaría la lógica para verificar si es operador de esta actividad específica
    // Por ejemplo, verificar en una colección de permisos
    return next();
  }

  res.status(403);
  throw new Error('No tienes permiso para gestionar esta actividad');
});

module.exports = { checkRole, checkActivityOperator };