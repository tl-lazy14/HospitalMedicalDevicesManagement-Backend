const mongoose = require('mongoose');
const config = require('./config');

const connectDB = () => {
  mongoose.connect(
    config.MONGODB_URI,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log('Mongoose connected to database');
    })
    .catch((err) => {
      console.log('Mongoose connection error:', err);
  });
};

module.exports = connectDB;