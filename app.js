const express = require("express");

const app = express();

global.user_id = null;
global.users = [];
global.tasks = [];

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello, World!");
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

const authMiddleware = require("./middleware/auth");
const taskRouter = require("./routes/taskRoutes");

app.use("/api/tasks", authMiddleware, taskRouter);

const notFound = require("./middleware/not-found");
app.use(notFound);

const errorHandlerMiddleware = require("./middleware/error-handler");
app.use(errorHandlerMiddleware);

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server is listening on port ${port}...`);
});

module.exports = { app, server };



