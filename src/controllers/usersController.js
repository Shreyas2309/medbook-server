const moment = require('moment');
const User = require('../models/User');
const Session = require('../models/Session');
const {
  schemaValidation,
  signInValidation,
} = require('../utils/validations/users');


exports.signUp = async (req, res) => {
  try {
 
    const { error } = schemaValidation(req.body);
    if (error) return res.status(400).send(error);


    const emailExist = await User.findOne({ email: req.body.email });
    if (emailExist) return res.status(400).send('email already exists');


    if (!req.body.confirmPassword === req.body.password) {
      return res.status(404).send('confirmed password is incorrect');
    }


    const user = new User(req.body);

    if (user.isDoctor) {
      delete user.clientInfo;
      user.doctorInfo.rating = 1;
    } else {
      delete user.doctorInfo;
    }
    user.tokens = [];

    await user.save();
    const token = await user.generateAuthToken();

    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
};


exports.signIn = async (req, res) => {
  try {

    const { error } = signInValidation(req.body);
    if (error) return res.status(400).send(error.details[0].message);


    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );

 
    const token = await user.generateAuthToken();

    res.status(201).send({ user, token });
  } catch (e) {
    res.status(400).send(e);
  }
};


exports.signOut = async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => {
      return token.token !== req.token;
    });
    await req.user.save();

    res.send();
  } catch (e) {
    res.status(400).send(e);
  }
};

exports.signOutAll = async (req, res) => {
  try {
    req.user.tokens = [];
    await req.user.save();

    res.send();
  } catch (e) {
    res.status(500).send();
  }
};

exports.viewProfile = async (req, res) => {
  try {
    if (!req.user) {
      res.status(401).send();
    }
    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
};


exports.updateProfile = async (req, res) => {
  try {

    const unrequiredFields = ['firstName', 'lastName', 'password'];
    unrequiredFields.forEach((field) => {
      if (!req.body[field]) {
        req.body[field] = req.user[field];
      }
    });

 
    req.body.confirmPassword = req.body.password;


    req.body.email = req.user.email;
    req.body.isDoctor = req.user.isDoctor;

    const { error } = schemaValidation(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    Object.keys(req.body).forEach((update) => {
      req.user[update] = req.body[update];
    });

    await req.user.save();

    res.status(201).send(req.user);
  } catch (e) {
    res.status(400).send(e);
  }
};


exports.deleteProfile = async (req, res) => {
  try {
    await req.user.remove();
    res.send(req.user);
  } catch (e) {
    res.status(500).send();
  }
};

exports.viewClients = async (req, res) => {
  try {
    if (!req.user.isDoctor) {
      res.status(403).send({ error: 'Forbidden' });
    }

   
    const bookedSessions = await Session.find(
      { doctor: req.user._id },
      function (err) {
        if (err) {
          return res.status(404).send();
        }
      }
    );

    const bookedWithClients = bookedSessions.map((session) => session.client);


    const users = await User.find(
      { _id: { $in: bookedWithClients } },
      function (err) {
        if (err) {
          return res.status(404).send();
        }
      }
    );
    res.status(200).send(users);
  } catch (e) {
    res.status(500).send();
  }
};


exports.viewClient = async (req, res) => {
  try {
    await Session.find(
      {
        doctor: req.user._id,
        client: req.params.id,
      },
      function (err) {
        if (err) {
          return res.status(404).send();
        }
      }
    );

    const user = await User.findOne(
      { _id: req.params.id, isDoctor: false },
      function (err) {
        if (err) {
          return res.status(404).send();
        }
      }
    );

    res.send(user);
  } catch (e) {
    res.status(500).send();
  }
};

exports.viewDoctors = async (req, res) => {
  try {
    const users = await User.find({ isDoctor: true });
    res.send(users);
  } catch (e) {
    res.status(500).send();
  }
};


exports.viewDoctor = async (req, res) => {
  try {
    const user = await User.findOne(
      { _id: req.params.id, isDoctor: true },
      function (err) {
        if (err) {
          return res.status(404).send();
        }
      }
    );
    res.send(user);
  } catch (e) {
    res.status(500).send();
  }
};