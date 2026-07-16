const dotenv = require("dotenv");
dotenv.config();
const fs = require("fs");
const path = require("path");
const { pool } = require("../config/db.js");

(async () => {
  let client;
  try {
    const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
    console.log("Applying schema...");
    client = await pool.connect();
    await client.query(sql);
    console.log("Schema applied successfully");
  } catch (error) {
    console.error("Error applying schema:", error.message || error);
    process.exit(1);
  } finally {
    if (client) client.release();
    await pool.end();
  }
})();
