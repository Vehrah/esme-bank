const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const dns = require("dns");
const notificationRoutes = require("./routes/notificationRoutes");

dotenv.config();

const app = express();

// CORS
const allowedOrigins = [
  "http://localhost:5173",
  "https://esm-bank.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without an Origin header (e.g. Postman)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
dns.setServers(["8.8.8.8", "1.1.1.1"]);

// Connect to MongoDB
const connectDB = require("./config/db");
connectDB();

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/account", require("./routes/accountRoutes"));
app.use("/api/transaction", require("./routes/transactionRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/notifications", notificationRoutes);

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});