const express = require('express');
const app = express();

app.use(express.json());

const authRouter = require('./routes/auth');
app.use('/api/v2', authRouter)

module.exports = app;
