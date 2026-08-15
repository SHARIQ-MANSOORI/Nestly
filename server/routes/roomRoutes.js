const express = require('express');
const router = express.Router();
const { getRoomById, updateRoom, deleteRoom } = require('../controllers/roomController');
const { protect } = require('../middleware/authenticate');
const { authorize } = require('../middleware/authorize');
const { verifyRoomOwnership } = require('../middleware/verifyOwnership');

router.route('/:id')
  .get(getRoomById)
  .put(protect, authorize('manager', 'admin'), verifyRoomOwnership, updateRoom)
  .delete(protect, authorize('manager', 'admin'), verifyRoomOwnership, deleteRoom);

module.exports = router;
