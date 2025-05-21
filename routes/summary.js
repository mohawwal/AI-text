const express = require("express");
const router = express.Router();
const axios = require("axios");
const pool = require("../model/db");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const { isAuthenticatedUser } = require("../middlewares/auth");

router.post(
	"/summary/save",
	isAuthenticatedUser,
	catchAsyncErrors(async (req, res, next) => {
		const { text, wordCount } = req.body;

		if (!text || typeof text !== "string" || text.trim() === "") {
			return next(new ErrorHandler("Text is required for summarization", 400));
		}

		if (!wordCount || isNaN(wordCount) || wordCount < 20 || wordCount > 1000) {
			return next(
				new ErrorHandler("Summary word count must be between 20 and 1000", 400),
			);
		}

		const creditRes = await pool.query(
			"SELECT balance FROM user_credits WHERE user_id = $1",
			[req.user.id],
		);

		const balance = creditRes.rows[0]?.balance ?? 0;
		if (balance <= 0)
			return next(new ErrorHandler("Insufficient credits", 403));

		let summary = "";
		let title = "";

		try {
			const openaiRes = await axios.post(
				"https://api.openai.com/v1/chat/completions",
				{
					model: "gpt-3.5-turbo",
					max_tokens: 512,
					temperature: 0.5,
					messages: [
						{
							role: "user",
							content: `Please summarize the following text in approximately ${wordCount} words, let the first 6 words be the title. Text: ${text}`,
						},
					],
				},
				{
					headers: {
						Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
						"Content-Type": "application/json",
					},
				},
			);

			const responseText = openaiRes.data?.choices?.[0]?.message?.content || "";
			summary = responseText.trim();
			title = summary.split(" ").slice(0, 6).join(" ") + "...";
		} catch (error) {
			console.error("OpenAI API error:", error.response?.data || error.message);
			return next(new ErrorHandler("Failed to summarize text", 500));
		}

		await pool.query(
			"INSERT INTO summary_texts (user_id, title, original_text, summary) VALUES ($1, $2, $3, $4)",
			[req.user.id, title, text, summary],
		);

		await pool.query(
			"UPDATE user_credits SET balance = balance - 1, last_updated = NOW() WHERE user_id = $1",
			[req.user.id],
		);

		res.status(201).json({
			success: true,
			title,
			summary,
		});
	}),
);

router.get(
	"/summary/:id",
	isAuthenticatedUser,
	catchAsyncErrors(async (req, res, next) => {
		const userId = req.user.id;

		const result = await pool.query(
			"SELECT * FROM summary_texts WHERE user_id = $1 ORDER BY created_at DESC",
			[userId],
		);

		if (result.rows.length === 0) {
			return next(new ErrorHandler("Summary not found or access denied", 404));
		}

		res.status(200).json({
			success: true,
			summary: result.rows,
		});
	}),
);

module.exports = router;
