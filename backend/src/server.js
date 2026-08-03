require("dotenv").config();

const dns = require("dns");

// Force Node.js to use Google's DNS servers
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const app = require("./app");
const connectDB = require("./database/db");

const PORT = process.env.PORT || 5000;

connectDB();

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});