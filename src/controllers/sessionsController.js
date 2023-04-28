const { v4 } = require('uuid');

const Session = require('../models/Session');
const User = require('../models/User');
const {
  sessionValidation,
  sessionsValidationMethod2,
  sessionExists,
  lessThanOneDay,
  isDoctorValidation,
} = require('../utils/validations/sessions');

exports.viewSessions = async (req, res) => {
  try {
    const sessions = req.user.isDoctor
      ? await Session.find({ doctor: req.user.id })
      : await Session.find({ client: req.user.id });

    console.log(sessions);

    const getSessions = async () => {
      let sanitizedSessions;
      if (!req.user.isDoctor) {
        sanitizedSessions = sessions.map(async (session) => {
          const returnedDoctor = await User.findOne({ _id: session.doctor });
          const returnedSession = { ...session._doc };
          returnedSession.user = { ...returnedDoctor._doc };
          return returnedSession;
        });
      } else {
          sanitizedSessions = sessions.map(async (session) => {
          const returnedClient = await User.findOne({ _id: session.client });
          const returnedSession = { ...session._doc };
          returnedSession.user = { ...returnedClient._doc };
          return returnedSession;
        });
      }
      return Promise.all(sanitizedSessions);
    };

    if (sessions.length > 0) {
      const awaitedSessions = await getSessions();
      console.log(awaitedSessions);

      res.send(awaitedSessions);
    } else {
      res.status(404).send({ error: 'no sessions found' });
    }
  } catch (e) {
    res.status(400).send(e);
  }
};

exports.viewDoctorSessions = async (req, res) => {
  try {

    const doctor = await User.findOne({ _id: req.params.id, isDoctor: true });

    if (!doctor) res.status(400).send({ error: 'Doctor does not exist' });

    const sessions = await Session.find({
      doctor: doctor.id,
      status: 'accepted',
    });

    let sanitizedSessions = null;

    if (doctor.id === req.user.id) {

      sanitizedSessions = sessions.map(async (session) => {
        const client = await User.findById(session.client);
        return {
          id: v4(),
          title: client,
          start: session.startTime,
          end: session.endTime,
          status: 'accepted',
        };
      });
    } else {
 
      sanitizedSessions = sessions.map((session) => ({
        id: v4(),
        title: 'Unavailable',
        start: session.startTime,
        end: session.endTime,
        status: 'unavailable',
      }));
    }

    res.send(sanitizedSessions);
  } catch (e) {
    res.status(400).send(e);
  }
};
exports.createSession = async (req, res) => {
  try {

    isDoctorValidation(req, true);

    const { startTime, endTime } = await sessionValidation(req, req.body, true);

    const session = new Session({
      startTime,
      endTime,
      doctor: req.user._id,
    });

    await session.save();
    res.send(session);
  } catch (e) {
    res.status(400).send(e);
  }
};

exports.createSessions = async (req, res) => {
  try {

    isDoctorValidation(req, true);

    const sessions = await sessionsValidationMethod2(req, req.body);

    res.status(201).send(sessions);
  } catch (e) {
    res.status(500).send();
  }
};


exports.acceptBooking = async (req, res) => {
  try {
  
    // isDoctorValidation(req, true);

    const session = await sessionExists(req);

 
    if (session.status === 'declined') {
      res.status(409).send({ error: 'booking is no longer available' });
    }

    session.status = 'accepted';
    session.save();

    res.status(200).send(session);
  } catch (e) {
    res.status(400).send(e);
  }
};

exports.declineBooking = async (req, res) => {
  try {
  
    // isDoctorValidation(req, true);

    const session = await sessionExists(req);

   
    if (session.status === 'accepted') {
      res.status(409).send({ error: 'booking is no longer available' });
    }

    session.status = 'declined';
    session.save();

    res.status(200).send(session);
  } catch (e) {
    res.status(400).send(e);
  }
};


exports.deleteSession = async (req, res) => {
  try {

    isDoctorValidation(req, true);


    const session = await Session.findById(req.params.id);

    if (!session) {
      res.status(404).send();
    }


    if (!(String(session.doctor) === String(req.user._id))) {
      res.status(400).send({ error: 'invalid action' });
    }


    if (session.client) {
      console.log('Session is booked by a client');
    }

    await session.remove();
    res.send(session);
  } catch (e) {
    res.status(500).send(e);
  }
};

exports.bookSession = async (req, res) => {
  try {

    isDoctorValidation(req, false);

    const session = await sessionExists(req);


    if (session.client) {
      res.status(400).send({ error: 'booking is no longer available' });
    }

    session.client = req.user._id;
    session.save();

    res.status(200).send(session);
  } catch (e) {
    res.status(400).send(e);
  }
};


exports.createBooking = async (req, res) => {
  try {

    isDoctorValidation(req, false);

    const { startTime, endTime } = await sessionValidation(req, req.body);

    const session = new Session({
      startTime,
      endTime,
      doctor: req.params.id,
      client: req.user.id,
      status: 'pending',
    });

    await session.save();
    res.send(session);
  } catch (e) {
    res.status(400).send(e);
  }
};

exports.updateSession = async (req, res) => {

  isDoctorValidation(req, false);

  const session = await sessionExists(req);


  if (String(session.client) !== String(req.user._id)) {
    res.status(400).send({ error: 'invalid action' });
  }

  const { startTime, endTime } = await sessionValidation(req, req.body, false);


  lessThanOneDay(session.startTime);

  try {
    session.startTime = startTime;
    session.endTime = endTime;
    session.save();

    res.status(200).send(session);
  } catch (e) {
    res.status(400).send(e);
  }
};


exports.cancelSession = async (req, res) => {

  isDoctorValidation(req, false);

  const session = await sessionExists(req);


  if (String(session.client) !== String(req.user._id)) {
    res.status(400).send({ error: 'invalid action' });
  }


  lessThanOneDay(session.startTime);

  try {
    session.client = null;
    session.save();

    res.send(session);
  } catch (e) {
    res.status(400).send(e);
  }
};
