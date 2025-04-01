const express = require('express');
const router = express.Router();
const {
  createTicket,
  getTickets,
  getUserTickets,
  getEventTickets,
  getTicketById,
  updateTicket,
  deleteTicket
} = require('../controllers/ticketController');
const { protect, isAdmin } = require('../middleware/auth');

// Rutas para tickets
router.route('/')
  .get(protect, getTickets)
  .post(protect, createTicket);

router.route('/:id')
  .get(protect, getTicketById)
  .put(protect, updateTicket)
  .delete(protect, isAdmin, deleteTicket);

// Rutas para tickets por usuario y evento
router.get('/user/:userId', protect, getUserTickets);
router.get('/event/:eventId', protect, getEventTickets);

module.exports = router;