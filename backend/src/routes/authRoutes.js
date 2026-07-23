const express = require("express");
const { register, login, me } = require("../controllers/authController.js");
const { requireAuth } = require("../middleware/auth.js");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);

module.exports = router;
