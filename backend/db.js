require("dotenv").config();
const { Pool } = require("pg");

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Test connection
pool.connect()
  .then(() => console.log("Connected to database"))
  .catch(err => console.error("Database connection error:", err));

module.exports = pool;
