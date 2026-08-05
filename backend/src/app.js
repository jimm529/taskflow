const express = require("express");

const authRouter = require("./routes/authRoutes");
const healthRoutes = require("./routes/health.routes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();

app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/tasks", taskRoutes);
// app.use("/api/v1/health", healthRoutes);

module.exports = app;
