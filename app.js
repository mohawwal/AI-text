const express = require('express');
const app = express();
const cookieParser = require('cookie-parser')

app.use(cookieParser());
app.use(express.json());

const authRouter = require('./routes/auth');
app.use('/api/v2', authRouter)

module.exports = app;
