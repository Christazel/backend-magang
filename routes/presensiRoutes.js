// ======= routes/presensiRoutes.js =======
import express from "express";
import {
  absenMasuk,
  absenKeluar,
  getPresensiHariIni,
  getRiwayatPresensi,
  getAllPresensi,
} from "../controllers/presensiController.js";

import { authMiddleware, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// ✅ Peserta
router.get("/hari-ini", authMiddleware, getPresensiHariIni);
router.get("/riwayat", authMiddleware, getRiwayatPresensi);
router.post("/masuk", authMiddleware, absenMasuk);
router.post("/keluar", authMiddleware, absenKeluar);

// ✅ Admin
router.get("/admin", authMiddleware, isAdmin, getAllPresensi);

export default router;
