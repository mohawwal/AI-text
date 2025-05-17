const express = require('express');
const router = express.Router();
const pool = require('../model/db');
const bcrypt = require('bcrypt');
const ErrorHandler = require('../utils/errorHandler');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');
const sendToken = require('../utils/jwtToken');

router.post('/auth/register', catchAsyncErrors(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new ErrorHandler("Email and Password required", 400));
    }

    const userExist = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExist.rows.length > 0) {
        return next(new ErrorHandler("User Email already registered", 400));
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await pool.query(
        'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING *',
        [email, hashedPassword]
    );

    sendToken(newUser.rows[0], 200, res);
}));

module.exports = router;
