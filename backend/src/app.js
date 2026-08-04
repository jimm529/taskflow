const express = require("express");

const authRouter =require("./routes/authRoutes");
const healthRoutes = require("./routes/health.routes");

const app = express();

app.use(express.json());

app.use("/app/auth", authRouter);
app.use("/api/v1/health", healthRoutes);

module.exports = app;