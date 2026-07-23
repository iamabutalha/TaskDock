const { query } = require("../config/db.js");
const asyncHandler = require("../utils/asyncHandler.js");

const searchUser = asyncHandler(async (req, res) => {
  const q = (req.query.q || "").trim();
  if (q.length < 2) return res.json({ users: [] });

  const { rows } = await query(
    `SELECT id, name, email, avatar_url
    FROM users
    WHERE name ILIKE $1 OR email ILIKE  $1
    ORDER BY name ASC
    LIMIT $2
    `,
    [`%${q}%`, 10],
  );

  res.json({ users: rows });
});

module.exports = { searchUser };
