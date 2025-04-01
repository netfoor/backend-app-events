const express = require('express');
const router = express.Router();

// Importar rutas
const userRoutes = require('./userRoutes');
const eventRoutes = require('./eventRoutes');
const activityRoutes = require('./activityRoutes');
const ticketRoutes = require('./ticketRoutes');
const calificationRoutes = require('./calificationRoutes');
const witnessRoutes = require('./witnessRoutes');
const fileRoutes = require('./fileRoutes');
const mainRoutes = require('./mainRoutes');

// Definir rutas
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/activities', activityRoutes);
router.use('/tickets', ticketRoutes);
router.use('/califications', calificationRoutes);
router.use('/witnesses', witnessRoutes);
router.use('/files', fileRoutes);
router.use('/main', mainRoutes);

module.exports = router;