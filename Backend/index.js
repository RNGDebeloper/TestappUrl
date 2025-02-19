const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Import routes
const authRoutes = require("../routes/auth");
const rewardRoutes = require("../routes/rewards");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/rewards", rewardRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Export as Vercel serverless function
module.exports = app;
