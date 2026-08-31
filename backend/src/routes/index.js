const inscripciones = require('./inscripciones');
const matriculas = require('./matriculas');
const pagos = require('./pagos');
const certificados = require('./certificados');

const express = require('express');
const router = express.Router();

router.use('/inscripciones', inscripciones);
router.use('/matriculas', matriculas);
router.use('/pagos', pagos);
router.use('/certificados', certificados);

module.exports = router;
