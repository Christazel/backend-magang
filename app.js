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

// ✅ Guard: pastikan JWT_SECRET tersedia sebelum server jalan
if (!process.env.JWT_SECRET) {
  throw new Error("❌ JWT_SECRET belum di-set di environment variables. Server tidak bisa jalan.");
}

await connectDB(); // ✅ penting: await supaya GridFS siap

const app = express();

// ✅ CORS whitelist — hanya izinkan domain yang terdaftar di env ALLOWED_ORIGINS
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim())
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Izinkan request tanpa origin (misal: Postman, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS: Origin '${origin}' tidak diizinkan.`));
    },
    credentials: true,
  })
);

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

// ✅ Global error handler — tangkap error yang tidak tertangani di route/controller
app.use((err, req, res, next) => {
  console.error("[Global Error Handler]", err.message || err);
  res.status(err.status || 500).json({
    msg: err.message || "Internal Server Error",
  });
});

export default app;
