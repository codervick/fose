const express = require('express');
const { 
  createEvent, 
  listEvents, 
  getEvent, 
  closeEvent,
  addParty,
  updatePartyRole,
  grantBranchAccess
} = require('../controllers/eventController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', protect, createEvent);
router.get('/', protect, listEvents);
router.get('/:eventId', protect, getEvent);
router.patch('/:eventId/close', protect, closeEvent);
router.post('/:eventId/parties', protect, addParty);
router.patch('/:eventId/parties/:partyId/role', protect, updatePartyRole);
router.post('/:eventId/parties/:partyId/access', protect, grantBranchAccess);

module.exports = router;