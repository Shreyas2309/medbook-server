const router = require('express').Router();

const verifyToken = require('./verifyToken');
const {
  viewSessions,
  viewDoctorSessions,
  createSession,
  createSessions,
  acceptBooking,
  declineBooking,
  deleteSession,
  bookSession,
  createBooking,
  updateSession,
  cancelSession,
} = require('../controllers/sessionsController');

router.get('/', verifyToken, viewSessions);

router.get('/:id/sessions', verifyToken, viewDoctorSessions);

router.patch('/:id/accept', verifyToken);

router.post('/:id/accept', acceptBooking);

router.patch('/:id/decline', verifyToken, declineBooking);

router.post('/:id/book', verifyToken, createBooking);


router.patch('/:id/update', verifyToken, updateSession);

router.patch('/:id/cancel', verifyToken, cancelSession);

module.exports = router;
