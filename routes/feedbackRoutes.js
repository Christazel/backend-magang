import express from "express";
import {
  createFeedback,
  getUserFeedback,
  getAllFeedback,
} from "../controllers/feedbackController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createFeedback);        // Kirim feedback
router.get("/", authMiddleware, getUserFeedback);        // Peserta lihat feedback
router.get("/admin", authMiddleware, getAllFeedback);    // Admin lihat semua (opsional)

export default router;
