// api/server.js
require("dotenv").config();
const express = require("express");

const app = express();
const port = process.env.PORT || 3001;

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from the API!" });
});

app.listen(port, () => {
  console.log(`API server is running on port ${port}`);
});
