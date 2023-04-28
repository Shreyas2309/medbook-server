const mongoose = require('mongoose');
require('colors');
const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useUnifiedTopology: true,
    });

    console.log(
      `MedBook database connected at: ${conn.connection.host}`.magenta.bold
    );
  } catch (e) {
    console.log(`Error: ${e.message}`.red);
    process.exit(1);
  }
};

module.exports = connectDB;
