const dotenv = require("dotenv");

dotenv.config();

const config = {
    PORT: process.env.PORT || 3001,
};
  
module.exports = config;