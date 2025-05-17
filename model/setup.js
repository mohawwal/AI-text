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
	} finally {
		pool.end();
	}
};

createUsersTable();
