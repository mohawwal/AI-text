const express = require("express");
const router = express.Router();
const pool = require("../model/db");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const { isAuthenticatedUser } = require("../middlewares/auth");

router.post(
	"/summary/save",
	isAuthenticatedUser,
	catchAsyncErrors(async (req, res, next) => {
		const { title, text, summary } = req.body;

		if (!text || !title || !summary) {
			return next(new ErrorHandler("Error in saving data", 400));
		}

		const creditRes = await pool.query(
			"SELECT balance FROM user_credits WHERE user_id = $1",
			[req.user.id]
		);

		if (creditRes.rows.length === 0) {
			return next(new ErrorHandler("User credit account not found", 400));
		}

		const currentBalance = creditRes.rows[0].balance;

		if (currentBalance <= 0) {
			return next(new ErrorHandler("Insufficient credits", 403));
		}

		await pool.query(
			"INSERT INTO summary_texts (user_id, title, original_text, summary) VALUES ($1, $2, $3, $4)",
			[req.user.id, title, text, summary]
		);

		await pool.query(
			"UPDATE user_credits SET balance = balance - 1, last_updated = NOW() WHERE user_id = $1",
			[req.user.id]
		);

		res.status(201).json({
			success: true,
			message: "Text summarized successfully.",
		});
	})
);


router.get(
    "/summary/:id",
    isAuthenticatedUser,
    catchAsyncErrors(async (req, res, next) => {
        const userId = req.user.id;

        const result = await pool.query(
            "SELECT * FROM summary_texts WHERE user_id = $1 ORDER BY created_at DESC",
            [userId]
        );

        if (result.rows.length === 0) {
            return next(new ErrorHandler("Summary not found or access denied", 404));
        }

        res.status(200).json({
            success: true,
            summary: result.rows,
        });
    })
);

module.exports = router;