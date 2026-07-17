const bcrypt = require("bcrypt");
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
});
