const { Pool } = require("pg");

const connectionString = (process.env.DATABASE_URL || "").replace(/[?&]sslmode=[^&]+/, "").replace(/[?&]channel_binding=[^&]+/, "");

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on("error", (err) => {
  console.error("Unexpacted Postgres pool error");
});

const query = (text, params) => pool.query(text, params);

const withTrasaction = async (callback) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = { pool, query, withTrasaction };
