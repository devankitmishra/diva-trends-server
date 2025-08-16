const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// Routes
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// TODO: Import your auth routes here
// const authRoutes = require("./routes/auth");
// app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


const authRoutes = require("./routes/auth");
app.use("/api/auth", authRoutes);
