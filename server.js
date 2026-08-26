const dns = require("node:dns");
const dotenv = require("dotenv");

// Load environment variables first
dotenv.config();

// Force Node.js to use reliable DNS servers
dns.setServers([
  "8.8.8.8",
  "8.8.4.4"
]);

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRouts");

const app = express();

const PORT = process.env.PORT || 5000;


// Middleware
app.use(express.json());

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(helmet());
app.use(cookieParser());


// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);


// Health Check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SyncBoard backend is running",
  });
});


// Connect DB & Start Server
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  });