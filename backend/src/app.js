const express = require("express");
const cors = require("cors");

const authRouter = require("./routes/authRoutes");
const healthRoutes = require("./routes/health.routes");
const taskRoutes = require("./routes/taskRoutes");

const app = express();
 app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/tasks", taskRoutes);
app.use("/api/v1/health", healthRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

module.exports = app;
