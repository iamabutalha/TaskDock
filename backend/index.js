require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const apiRoutes = require("./src/routes");
const {
  errorHandler,
  notFoundHandler,
} = require("./src/middleware/errorHandler.js");
const { initSocket } = require("./src/socket/index.js");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the API" });
});
app.use("/api", apiRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5050;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
