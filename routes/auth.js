const express = require("express");
const router = express.Router();
const pool = require("../model/db");
const bcrypt = require("bcrypt");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const { isAuthenticatedUser } = require("../middlewares/auth");
const sendEmail = require("../utils/sendEmail");

const crypto = require("crypto");

router.post(
  "/auth/register",
  catchAsyncErrors(async (req, res, next) => {
    const { email, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      return next(new ErrorHandler("Email, Password and Confirm Password are required", 400));
    }

    if (password !== confirmPassword) {
      return next(new ErrorHandler("Passwords do not match", 400));
    }

    const userRes = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const existingUser = userRes.rows[0];

    if (existingUser) {
      if (existingUser.is_verified) {
        return next(new ErrorHandler("User email already registered", 400));
      } else {
        // Avoid sending multiple verification emails
        if (existingUser.email_verify_expire && existingUser.email_verify_expire > new Date()) {
          return res.status(429).json({
            success: false,
            message: "Verification email already sent. Please wait before requesting a new one.",
          });
        }

        const rawToken = crypto.randomBytes(32).toString("hex");
        const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
        const tokenExpire = new Date(Date.now() + 10 * 60 * 1000);

        await pool.query(
          "UPDATE users SET email_verify_token = $1, email_verify_expire = $2 WHERE id = $3",
          [hashedToken, tokenExpire, existingUser.id]
        );

        const verifyUrl = `${req.protocol}://${req.get("host")}/api/v2/auth/verify/${rawToken}`;
        const message = `Hi! Please click the link below to verify your email:\n\n${verifyUrl}\n\nIf you didn't request this, please ignore.`;

        await sendEmail({
          email,
          subject: "Verify your email for AI Paper",
          message,
        });

        return res.status(200).json({
          success: true,
          message: "Verification email has been resent.",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
    const tokenExpire = new Date(Date.now() + 10 * 60 * 1000);

    const insertUser = await pool.query(
      `INSERT INTO users (email, password, email_verify_token, email_verify_expire)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [email, hashedPassword, hashedToken, tokenExpire]
    );

    const userId = insertUser.rows[0].id;

    await pool.query(
      "INSERT INTO user_credits (user_id, balance) VALUES ($1, 100)",
      [userId]
    );

    const verifyUrl = `${req.protocol}://${req.get("host")}/api/v2/auth/verify/${rawToken}`;
    const message = `Hi! Please click the link below to verify your email:\n\n${verifyUrl}\n\nIf you didn't request this, please ignore.`;

    await sendEmail({
      email,
      subject: "Verify your email for Zarmario",
      message,
    });

    res.status(200).json({
      success: true,
      message: "Verification email sent to " + email,
    });
  })
);


router.get(
	"/auth/verify/:token",
	catchAsyncErrors(async (req, res, next) => {
		const hashedToken = crypto
			.createHash("sha256")
			.update(req.params.token)
			.digest("hex");

		const result = await pool.query(
			"SELECT * FROM users WHERE email_verify_token = $1 AND email_verify_expire > NOW()",
			[hashedToken],
		);

		if (result.rows.length === 0) {
			return next(new ErrorHandler("Invalid or expired token", 400));
		}

		const user = result.rows[0];
		await pool.query(
			"UPDATE users SET is_verified = true, email_verify_token = NULL, email_verify_expire = NULL WHERE id = $1",
			[user.id],
		);

		res.status(200).json({
			success: true,
			message: "Email verified successfully. You can now login",
		});
	}),
);

router.post(
	"/auth/login",
	catchAsyncErrors(async (req, res, next) => {
		const { email, password } = req.body;

		if (!email || !password) {
			return next(new ErrorHandler("Email and Password required", 400));
		}

		const userQuery = await pool.query("SELECT * FROM users WHERE email = $1", [
			email,
		]);

		if (userQuery.rows.length === 0) {
			return next(new ErrorHandler("Invalid email or password", 401));
		}

		const user = userQuery.rows[0];
		const isPasswordValid = await bcrypt.compare(password, user.password);

		if (!isPasswordValid) {
			return next(new ErrorHandler("Invalid email or password", 401));
		}

		if (!user.is_verified) {
			if (user.email_verify_expire && user.email_verify_expire > new Date()) {
				return next(
					new ErrorHandler(
						"Verification email already sent. Please check your inbox.",
						429,
					),
				);
			}

			const rawToken = crypto.randomBytes(32).toString("hex");
			const hashedToken = crypto
				.createHash("sha256")
				.update(rawToken)
				.digest("hex");
			const tokenExpire = new Date(Date.now() + 10 * 60 * 1000);

			await pool.query(
				"UPDATE users SET email_verify_token = $1, email_verify_expire = $2 WHERE id = $3",
				[hashedToken, tokenExpire, user.id],
			);

			const verifyUrl = `${req.protocol}://${req.get(
				"host",
			)}/api/v2/auth/verify/${rawToken}`;
			const message = `Hi! Please click the link below to verify your email:\n\n${verifyUrl}\n\nIf you didn't request this, please ignore.`;

			await sendEmail({
				email: user.email,
				subject: "Verify your email for Zarmario",
				message,
			});

			return next(
				new ErrorHandler(
					"Email not verified. A new verification email has been sent.",
					403,
				),
			);
		}

		sendToken(user, 200, res);
	}),
);

router.get(
	"/profile",
	isAuthenticatedUser,
	catchAsyncErrors(async (req, res, next) => {
		res.status(200).json({
			success: true,
			user: {
				id: req.user.id,
				email: req.user.email,
			},
		});
	}),
);

module.exports = router;
