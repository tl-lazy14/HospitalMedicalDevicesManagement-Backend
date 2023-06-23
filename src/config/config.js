const dotenv = require("dotenv");

dotenv.config();

const config = {
    PORT: process.env.PORT,
    MONGODB_URI: process.env.MONGODB_URI,
    JWT_ACCESS_KEY: process.env.JWT_ACCESS_KEY,
    JWT_REFRESH_KEY: process.env.JWT_REFRESH_KEY,
};
  
module.exports = config;