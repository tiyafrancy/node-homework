const express = require("express");
const path = require("path");
const { randomUUID } = require("crypto");
const dogsRouter = require("./routes/dogs");

const app = express();

// Assignment 3b and 3c ask you to add middleware in this file.

app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}]: ${req.method} ${req.path} (${req.requestId})`);
  next();
});

app.use(express.json());

app.use('/images', express.static(path.join(__dirname, 'public/images')));

app.use("/", dogsRouter);// Do not remove this line

app.use((req, res, next) => {
  res.status(404).json({
    error: "Route not found",
    requestId: req.requestId,
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: statusCode === 500 ? "Internal Server Error" : err.message,
    requestId: req.requestId,
  });
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log("Dog rescue app is listening on port 3000...");
  });
}

module.exports = app;

