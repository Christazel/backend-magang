import express from "express";
import multer from "multer";
import mongoose from "mongoose";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { getBucket } from "../utils/gridfs.js";

import {
  uploadLaporan,
  getLaporanList,
  getLaporanPeserta,
  updateDeskripsiLaporan,
  deleteLaporan,
  uploadLaporanBase64,

  // ✅ baru
  adminReviewLaporan,
  updateLaporanFile,
  updateLaporanBase64ById,
} from "../controllers/laporanController.js";

const router = express.Router();

// ✅ Multer MEMORY (aman untuk Vercel serverless)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
});

// Upload laporan oleh peserta (multipart)
router.post("/", authMiddleware, upload.single("file"), uploadLaporan);

// Upload laporan via base64
router.post("/base64", authMiddleware, uploadLaporanBase64);

// Get laporan milik peserta
router.get("/", authMiddleware, getLaporanPeserta);

// Get semua laporan (admin)
router.get("/admin", authMiddleware, getLaporanList);

// ✅ ADMIN: nilai laporan (sesuai/revisi + catatan)
router.put("/admin/:id/review", authMiddleware, adminReviewLaporan);

// Update deskripsi (peserta)
router.put("/:id", authMiddleware, updateDeskripsiLaporan);

// ✅ PESERTA: kirim ulang laporan (replace file) multipart
router.put("/:id/file", authMiddleware, upload.single("file"), updateLaporanFile);

// ✅ PESERTA: kirim ulang laporan (replace file) base64
router.put("/:id/base64", authMiddleware, updateLaporanBase64ById);

// Hapus laporan
router.delete("/:id", authMiddleware, deleteLaporan);

// ✅ Download laporan berdasarkan fileId GridFS
router.get("/download/:fileId", authMiddleware, async (req, res) => {
  try {
    const bucket = getBucket();
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);

    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files.length) return res.status(404).json({ msg: "File tidak ditemukan" });

    const f = files[0];
    res.setHeader("Content-Type", f.contentType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${f.filename}"`);

    bucket.openDownloadStream(fileId).pipe(res);
  } catch (err) {
    res.status(500).json({ msg: "Gagal download", error: err.message });
  }
});

export default router;
