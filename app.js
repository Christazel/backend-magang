import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import mongoose from "mongoose";

// Security & Enhancement Packages
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { xss } from "express-xss-sanitizer";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

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

// ==========================================
// 🛡️ SECURITY & OBSERVABILITY MIDDLEWARE
// ==========================================

// 1. Security HTTP Headers
app.use(helmet());

// 2. Request Logging
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// 3. Global Rate Limiter (Anti-Spam / DDoS)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Menit
  max: 500, // Batasi setiap IP maks 500 request per 15 menit
  message: { msg: "Terlalu banyak request, silakan coba lagi setelah 15 menit." },
  standardHeaders: true, // Kembalikan info rate limit di header `RateLimit-*`
  legacyHeaders: false, // Matikan header `X-RateLimit-*`
});
app.use(globalLimiter);

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

// 4. Data Sanitization (Harus setelah body-parser)
app.use(mongoSanitize()); // Cegah NoSQL Injection
app.use(xss()); // Cegah XSS (dengan express-xss-sanitizer)


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
