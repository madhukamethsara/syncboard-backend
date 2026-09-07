const dotenv = require("dotenv");

dotenv.config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");

const connectDB = require("./src/config/db");
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const teamRoutes = require("./src/routes/teamRoutes");
const boardRoutes = require("./src/routes/boardRoutes");
const columnRoutes = require("./src/routes/columnRoutes");
const taskRoutes = require("./src/routes/taskRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");

const app = express();

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";


// MIDDLEWARE
app.use(express.json());

app.use(
  cors({

    origin: FRONTEND_URL,
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(helmet());

app.use(cookieParser());


// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/boards", boardRoutes);
app.use("/api/columns", columnRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications",notificationRoutes);

// HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "SyncBoard backend is running",
  });
});


// CONNECT DB & START SERVER
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
