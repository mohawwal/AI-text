const express = require('express');
const app = express();
const cookieParser = require('cookie-parser')

app.use(cookieParser());
app.use(express.json());

const authRouter = require('./routes/auth');
app.use('/api/v2', authRouter)

const summaryRouter = require('./routes/summary')
app.use('/api/v2', summaryRouter)

const balanceRouter = require('./routes/credit')
app.use('/api/v2', balanceRouter)

module.exports = app;