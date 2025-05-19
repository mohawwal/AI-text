const express = require("express");
const router = express.Router();
const pool = require("../model/db");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const { isAuthenticatedUser } = require("../middlewares/auth");

router.get(
  "/balance",
  isAuthenticatedUser,
  catchAsyncErrors(async (req, res, next) => {
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT balance FROM user_credits WHERE user_id = $1",
      [userId]
    );

    if (result.rows.length === 0) {
      return next(new ErrorHandler("User credit account not found", 404));
    }

    res.status(200).json({
      success: true,
      balance: result.rows[0].balance,
    });
  })
);

module.exports = router;
