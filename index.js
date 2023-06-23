const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./src/config/connectDB')
const config = require('./src/config/config')

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json())

connectDB();

app.get('/', (req, res) => {
  res.send('Hello, world!');
});

const port = config.PORT;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});