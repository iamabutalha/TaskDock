const express = require("express");
const authRoutes = require("./authRoutes.js");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ message: "Welcome to the API" });
});

router.use("/auth", authRoutes);

module.exports = router;
