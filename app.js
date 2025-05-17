const express = require('express');
const app = express();

app.use(express.json());

const homeRouter = require('./routes/home');
app.use('/api/v2', homeRouter);

module.exports = app;
