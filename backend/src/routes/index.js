const express = require("express");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ message: "Welcome to the API" });
});

module.exports = router;
