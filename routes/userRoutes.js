const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getUsers,
  deleteUser,
  getUserById,
  updateUser
} = require('../controllers/userController');
const { protect, isAdmin } = require('../middleware/auth');

// Rutas públicas
router.post('/', registerUser);
router.post('/login', loginUser);

// Rutas protegidas
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Rutas de administrador
router.route('/')
  .get(protect, isAdmin, getUsers);

router.route('/:id')
  .get(protect, isAdmin, getUserById)
  .put(protect, isAdmin, updateUser)
  .delete(protect, isAdmin, deleteUser);

module.exports = router;