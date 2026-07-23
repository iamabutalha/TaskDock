const bcrypt = require("bcryptjs");
const { query } = require("../config/db.js");
const { signToken } = require("../utils/jwt.js");
const ApiError = require("../utils/ApiError.js");
const asyncHandler = require("../utils/asyncHandler.js");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicUser = (u) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  avatar_url: u.avatar_url,
  created_at: u.created_at,
});

const register = asyncHandler(async (req, res) => {
  const name = (req.body.name || "").trim();
  const email = (req.body.email || "").trim.toLowerCase();
  const { password } = req.body;

  if (!name) throw ApiError.badRequest("Name is require");
  if (!EMAIL_RE.test(email))
    throw ApiError.badRequest("A valid email is required");
  if (!password || password.length < 6)
    throw ApiError.badRequest("Password mut be 6 character");

  const existing = await query("SELECT * FROM users WHERE email = $1", [email]);

  if (existing.rows.length)
    throw ApiError.badRequest("Email already registered");

  const passwordhash = await bcrypt.hash(password, 10);

  const { rows } = await query(`
    INSERT INTO users (name, email, password_hash)
    VALUES ($1, $2, $3)
    RETURNING id, name, email, avatar_url, created_at
  `);

  const user = rows[0];
  const token = signToken({ id: user.id, email: user.email, name: user.name });

  res.status(201).json({ user: publicUser(user), token });
});

const login = asyncHandler(async (req, res) => {
  const email = (req.body.email || "").trim().toLowerCase();
  const { password } = req.body;

  if (!email || !password) {
    throw ApiError.badRequest("Email and password ar required");
  }

  const { rows } = await query("SELECT * FROM users WHERE email = $1", [email]);

  const user = rows[0];
  if (!user) throw ApiError.unauthorized("Invalid password or email");
  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) throw ApiError.unauthorized("Invalid credentials");

  const token = signToken({ id: user.id, name: user.name, email: user.email });

  res.json({ user: publicUser(user), token });
});

const me = asyncHandler(async (req, res) => {
  const { rows } = await query("SELECT * FROM users WHERE id = $1", [
    req.user.id,
  ]);
  const user = rows[0];
  if (!user) throw ApiError.unauthorized("User not found");
  res.json({ user: rows[0] });
});

module.exports = {
  register,
  me,
  login,
};
