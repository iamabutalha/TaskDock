const express = require("express");
const { requireAuth } = require("../middleware/auth.js");
const { searchUser } = require("../controllers/userController.js");

const router = express.Router();

router.get("/search", requireAuth, searchUser);

module.exports = router;
