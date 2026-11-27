require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();

app.set("trust proxy", 1);

const helmet = require("helmet");
const { xss } = require("express-xss-sanitizer");
const rateLimiter = require("express-rate-limit");

const prisma = require("./db/prisma");

// Rate limiting
const limiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per window
});
app.use(limiter);

// global.user_id = null;
// global.users = [];
// global.tasks = [];

// Security headers
app.use(helmet());

app.use(express.json());
app.use(cookieParser());
app.use(xss());

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'not connected',error: err.message });
  }
});

app.post("/testpost", (req, res) => {
  res.status(200).json({
    message: "POST route works",
  });
});

const timeRouter = require("./routes/timeRoutes");
app.use("/api", timeRouter);

const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);

// const authMiddleware = require("./middleware/auth");
// const taskRouter = require("./routes/taskRoutes");
// app.use("/api/tasks", authMiddleware, taskRouter);

const jwtMiddleware = require("./middleware/jwtMiddleware");
const taskRouter = require("./routes/taskRoutes");
app.use("/api/tasks", jwtMiddleware, taskRouter);

const analyticsRoutes = require("./routes/analyticsRoutes");
app.use("/api/analytics", jwtMiddleware, analyticsRoutes);

const notFound = require("./middleware/not-found");
app.use(notFound);

const errorHandlerMiddleware = require("./middleware/error-handler");
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});

let isShuttingDown = false;
async function shutdown(code = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log("Shutting down gracefully...");
  try {
    await new Promise((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log("HTTP server closed.");
    await prisma.$disconnect();
    console.log("Prisma disconnected");
  } catch (err) {
    console.error("Error during shutdown:", err);
    code = 1;
  } finally {
    process.exit(code);
  }
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

module.exports = { app, server };



