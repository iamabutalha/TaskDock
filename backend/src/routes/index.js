const express = require("express");
const authRoutes = require("./authRoutes.js");
const boardRoutes = require("./boardRoutes.js");
const userRoutes = require("./userRoutes.js");

const router = express.Router();

router.get("/health", (_req, res) => {
  res.json({ message: "Welcome to the API" });
});

router.use("/auth", authRoutes);

router.use("/boards", boardRoutes);
router.use("/users", userRoutes);

module.exports = router;
