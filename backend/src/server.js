require("dotenv").config();

const dns = require("dns");
const app = require("./app");
const connectDB = require("./database/db");

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`🚀Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    process.exit(1);
  }
};

startServer();
