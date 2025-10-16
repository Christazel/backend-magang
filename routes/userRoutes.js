import express from "express";
import { getAllPeserta, getAllPesertaWithStats } from "../controllers/userController.js";
import { authMiddleware, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// List peserta basic (tanpa statistik) — opsional jika masih dipakai
router.get("/peserta", authMiddleware, getAllPeserta);

// ✅ Endpoint baru untuk admin: daftar peserta + jumlah hadir & tugas
router.get("/admin/peserta", authMiddleware, isAdmin, getAllPesertaWithStats);

export default router;
