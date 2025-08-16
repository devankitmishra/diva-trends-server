import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import authRoutes from "./routes/auth.js";
import bannerRoutes from "./routes/bannerRoutes.js";


dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Test route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/banners", bannerRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
