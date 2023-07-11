const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./src/config/connectDB')
const authRoute = require('./src/routes/auth');
const userRoute = require('./src/routes/user');
const deviceRoute = require('./src/routes/device');
const config = require('./src/config/config');

const app = express();

app.use(cors());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json())

app.use('/api/auth', authRoute);
app.use('/api/user', userRoute);
app.use('/api/device', deviceRoute);

connectDB();

const port = config.PORT;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});