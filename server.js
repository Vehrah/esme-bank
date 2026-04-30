const express = require("express");
const dotenv = require("dotenv");

dotenv.config(); 

const dns = require("dns");
dns.setServers(['8.8.8.8', '1.1.1.1'])

const connectDB = require("./config/db");
connectDB();

const app = express();
app.use(express.json());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/account", require("./routes/accountRoutes"));
app.use("/api/transaction", require("./routes/transactionRoutes"));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
