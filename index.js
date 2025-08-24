import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import authRoutes from "./routes/auth.js";
import bannerRoutes from "./routes/bannerRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import cookieParser from "cookie-parser";


dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors({
    origin: [
      "http://localhost:5173",  // local dev
      "https://unscript-v48m.onrender.com", // uat frontend domain
    ],
    credentials: true, // allow cookies/authorization headers
  }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Test route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/menu", menuRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
