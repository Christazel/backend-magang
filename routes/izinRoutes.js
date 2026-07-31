// ======= routes/izinRoutes.js =======
import express from "express";
import {
  ajukanIzin,
  getMyIzin,
  deleteIzin,
  getAllIzin,
  approveIzin,
} from "../controllers/izinController.js";
import { authMiddleware, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Peserta
router.post("/", authMiddleware, ajukanIzin);
router.get("/", authMiddleware, getMyIzin);
router.delete("/:id", authMiddleware, deleteIzin);

// ✅ Admin
router.get("/admin", authMiddleware, isAdmin, getAllIzin);
router.put("/:id/approve", authMiddleware, isAdmin, approveIzin);

export default router;
