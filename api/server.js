// api/server.js
require("dotenv").config();
const express = require("express");

const app = express();
const port = process.env.PORT || 3001;

// CORS middleware
app.use(cors());

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the API!" });
});

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

app.listen(port, () => {
  console.log(`API server is running on port ${port}`);
});
