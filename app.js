const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const ErrorHandler = require('./utils/errorHandler')


const allowedOrigins = [
  'http://localhost:5173',
  'https://your-live-domain.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return next(new ErrorHandler('Not allowed by CORS', 404));
    }
  },
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

// Routes
const authRouter = require('./routes/auth');
app.use('/api/v2', authRouter);

const summaryRouter = require('./routes/summary');
app.use('/api/v2', summaryRouter);

const balanceRouter = require('./routes/credit');
app.use('/api/v2', balanceRouter);

module.exports = app;
