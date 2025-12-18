import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import mongoose from "mongoose";

import authRoutes from "./routes/authRoutes.js";
import presensiRoutes from "./routes/presensiRoutes.js";
import laporanRoutes from "./routes/laporanRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();
await connectDB(); // ✅ penting: await supaya GridFS siap

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/presensi", presensiRoutes);
app.use("/api/laporan", laporanRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/users", userRoutes);

app.get("/api/test", (req, res) => res.json({ message: "Koneksi backend berhasil!" }));
app.get("/api/db-test", (req, res) => {
  res.json({ readyState: mongoose.connection.readyState }); // 1 = connected
});

export default app;
