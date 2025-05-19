const pool = require("./db");

const createUsersTable = async () => {
	try {
		await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
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

const main = async () => {
	await createUsersTable();
	await alterUsersTable();
	await pool.end();
};

main();
