
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');


const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/mongodb');


dotenv.config({ path: './config/.env' });

const usersRoute = require('./src/routes/users');
const uploadsRoute = require('./src/routes/uploads');
const sessionsRoute = require('./src/routes/sessions');
const samplePrivateRoute = require('./src/routes/samplePrivate');


const app = express();


connectDB();



app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  );
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE');
    return res.status(200).json({});
  }
  next();
});

app.use('/api/users', usersRoute);
app.use('/api/sessions', sessionsRoute);
app.use('/api/uploads', uploadsRoute);
app.use('/api/sample-private', samplePrivateRoute);


app.get('/api', (req, res) => res.send('Hello world!'));


if (process.env.NODE_ENV === 'production') {
  app.use(express.static('../frontend/build'));

  app.get('*', (req, res) =>
    res.sendFile(
      path.resolve(__dirname, '../', 'frontend', 'build', 'index.html')
    )
  );
}

module.exports = app;
