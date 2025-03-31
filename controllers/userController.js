const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const { generateToken } = require('../utils/jwtGenerator');
const { isValidEmail, isStrongPassword } = require('../utils/validations');

// @desc    Registrar un nuevo usuario
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  // Validaciones
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Por favor complete todos los campos requeridos');
  }

  if (!isValidEmail(email)) {
    res.status(400);
    throw new Error('Por favor ingrese un email válido');
  }

  if (!isStrongPassword(password)) {
    res.status(400);
    throw new Error('La contraseña debe tener al menos 6 caracteres, una letra y un número');
  }

  // Verificar si el usuario ya existe
  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error('El usuario ya existe');
  }

  // Determinar el rol (solo los administradores pueden crear otros administradores)
  let userRole = 'user';
  if (req.user && req.user.role === 'admin' && role) {
    userRole = role;
  }

  // Crear el usuario
  const user = await User.create({
    name,
    email,
    password,
    role: userRole,
    changedHistory: [{
      date: new Date(),
      changeType: 'create'
    }]
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id)
    });
  } else {
    res.status(400);
    throw new Error('Datos de usuario inválidos');
  }
});

// @desc    Autenticar usuario y obtener token
// @route   POST /api/users/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validar email y contraseña
  if (!email || !password) {
    res.status(400);
    throw new Error('Por favor ingrese email y contraseña');
  }

  // Buscar usuario por email
  const user = await User.findOne({ email });

  // Verificar si el usuario existe y la contraseña es correcta
  if (user && (await user.matchPassword(password))) {
    // Actualizar la última sesión
    user.lastSession = Date.now();
    await user.save();

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      token: generateToken(user._id)
    });
  } else {
    res.status(401);
    throw new Error('Email o contraseña incorrectos');
  }
});

// @desc    Obtener perfil de usuario
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('Usuario no encontrado');
  }
});

// @desc    Actualizar perfil de usuario
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    
    // Solo actualizar la contraseña si se proporciona una nueva
    if (req.body.password) {
      if (!isStrongPassword(req.body.password)) {
        res.status(400);
        throw new Error('La contraseña debe tener al menos 6 caracteres, una letra y un número');
      }
      user.password = req.body.password;
    }

    // Actualizar información de cambios
    user.changedDate = Date.now();
    user.changedBy = req.user._id;
    user.changedType = 'update';
    user.changedHistory.push({
      date: new Date(),
      user: req.user._id,
      changeType: 'update'
    });

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      phone: updatedUser.phone,
      token: generateToken(updatedUser._id)
    });
  } else {
    res.status(404);
    throw new Error('Usuario no encontrado');
  }
});

// @desc    Obtener todos los usuarios
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ isDeleted: false }).select('-password');
  res.json(users);
});

// @desc    Eliminar usuario
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    // Marcar como eliminado en lugar de eliminar físicamente
    user.isDeleted = true;
    user.changedDate = Date.now();
    user.changedBy = req.user._id;
    user.changedType = 'delete';
    user.changedHistory.push({
      date: new Date(),
      user: req.user._id,
      changeType: 'delete'
    });

    await user.save();
    res.json({ message: 'Usuario eliminado' });
  } else {
    res.status(404);
    throw new Error('Usuario no encontrado');
  }
});

// @desc    Obtener usuario por ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (user && !user.isDeleted) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('Usuario no encontrado');
  }
});

// @desc    Actualizar usuario
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role;
    user.phone = req.body.phone || user.phone;
    
    // Actualizar permisos si se proporcionan
    if (req.body.permissions) {
      user.permissions = {
        ...user.permissions,
        ...req.body.permissions
      };
    }

    // Actualizar información de cambios
    user.changedDate = Date.now();
    user.changedBy = req.user._id;
    user.changedType = 'update';
    user.changedHistory.push({
      date: new Date(),
      user: req.user._id,
      changeType: 'update'
    });

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      permissions: updatedUser.permissions,
      phone: updatedUser.phone
    });
  } else {
    res.status(404);
    throw new Error('Usuario no encontrado');
  }
});

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser
};