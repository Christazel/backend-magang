import express from "express";
import { getAllPeserta, getAllPesertaWithStats, deletePeserta, resetPasswordPeserta } from "../controllers/userController.js";
import { authMiddleware, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// List peserta basic (tanpa statistik) — opsional jika masih dipakai
router.get("/peserta", authMiddleware, isAdmin, getAllPeserta);

// ✅ Endpoint baru untuk admin: daftar peserta + jumlah hadir & tugas
router.get("/admin/peserta", authMiddleware, isAdmin, getAllPesertaWithStats);

// ✅ ADMIN: Hapus peserta berserta seluruh data (Cascading Delete)
router.delete("/admin/peserta/:id", authMiddleware, isAdmin, deletePeserta);

// ✅ ADMIN: Reset password peserta ke default
router.put("/admin/peserta/:id/reset-password", authMiddleware, isAdmin, resetPasswordPeserta);

export default router;
