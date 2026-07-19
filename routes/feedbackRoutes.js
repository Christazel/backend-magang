import express from "express";
import {
  createFeedback,
  getUserFeedback,
  getAllFeedback,
} from "../controllers/feedbackController.js";
import { authMiddleware, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Kirim feedback — hanya admin yang boleh (dilindungi isAdmin middleware)
router.post("/", authMiddleware, isAdmin, createFeedback);

// Peserta lihat feedback milik mereka
router.get("/", authMiddleware, getUserFeedback);

// ✅ Admin lihat semua feedback (dilindungi isAdmin middleware)
router.get("/admin", authMiddleware, isAdmin, getAllFeedback);

export default router;
