const express = require('express');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');


const allowedOrigins = [
  'http://localhost:3000',
  'https://your-live-domain.com'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
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
