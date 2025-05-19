const pool = require("./db");

const createUsersTable = async () => {
	try {
		await pool.query(`
		CREATE TABLE IF NOT EXISTS users (
			id SERIAL PRIMARY KEY,
			email VARCHAR(255) UNIQUE NOT NULL,
			password TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		)
    `);
		console.log("Users table created");
	} catch (err) {
		console.error("Error creating table:", err);
	}
};

const alterUsersTable = async () => {
	try {
		await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS email_verify_token TEXT,
      ADD COLUMN IF NOT EXISTS email_verify_expire TIMESTAMP;
    `);
		console.log("Users table altered for email verification");
	} catch (err) {
		console.error("Error altering table:", err);
	}
};

const UserSummaryText = async () => {
	try {
		await pool.query(`
		CREATE TABLE summary_texts (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
			title TEXT NOT NULL,
			original_text TEXT NOT NULL,
			summary TEXT,
			created_at TIMESTAMP DEFAULT NOW()
		);
		`);
			console.log("User summary text table created successfully")
	}catch (err) {
		console.error("Error in creating user summary text table")
	}
}

const UserCreditTable = async () => {
	try {
		await pool.query(`
		CREATE TABLE user_credits (
			id SERIAL PRIMARY KEY,
			user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
			balance INTEGER NOT NULL DEFAULT 100,
			last_updated TIMESTAMP DEFAULT NOW()
		);
		`);
			console.log("User credit table created successfully")
	}catch (err) {
		console.error("Error in creating user credit table")
	}
}

const main = async () => {
	await createUsersTable();
	await alterUsersTable();
	await UserSummaryText();
	await UserCreditTable()
	await pool.end();
};

main();
