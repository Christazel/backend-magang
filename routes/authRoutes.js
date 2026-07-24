import express from "express";
import { register, login } from "../controllers/authController.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

// 🛡️ Auth Limiter Khusus (Anti-Bruteforce Password)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // Hanya boleh 5x percobaan per IP
  message: { msg: "Terlalu banyak percobaan login, akun ini diblokir sementara selama 15 menit." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", register);
router.post("/login", authLimiter, login); // Terapkan hanya di /login

export default router;
