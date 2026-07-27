import express from "express";
import { register, login } from "../controllers/authController.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// 🛡️ Auth Limiter Khusus (Anti-Bruteforce & Anti-Spam Registrasi)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // Hanya boleh 5x percobaan per IP
  message: { msg: "Terlalu banyak percobaan, akun ini diblokir sementara selama 15 menit." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", authLimiter, register); // ✅ Lindungi dari spam registrasi
router.post("/login", authLimiter, login);        // ✅ Lindungi dari bruteforce

export default router;
