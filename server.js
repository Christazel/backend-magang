import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import presensiRoutes from "./routes/presensiRoutes.js";
import laporanRoutes from "./routes/laporanRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();
connectDB();

const app = express();

// ✅ CORS fleksibel agar Flutter Web dan Mobile bisa akses
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/presensi", presensiRoutes);
app.use("/api/laporan", laporanRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/users", userRoutes);

// Endpoint tes koneksi (optional)
app.get("/api/test", (req, res) => {
  res.json({ message: "Koneksi backend berhasil!" });
});

// ✅ Penting: bind ke 0.0.0.0 agar bisa diakses dari device lain (HP)
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`✅ Server running on port ${PORT}`)
);
