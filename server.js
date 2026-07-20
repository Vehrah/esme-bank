const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const dns = require("dns");

dotenv.config();

const app = express(); // Create app FIRST

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = require("./config/db");
connectDB();

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/account", require("./routes/accountRoutes"));
app.use("/api/transaction", require("./routes/transactionRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});