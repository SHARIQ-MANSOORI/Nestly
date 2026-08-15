const express = require('express');
const router = express.Router();
const { getRoomById } = require('../controllers/roomController');

router.route('/:id')
  .get(getRoomById);

module.exports = router;
