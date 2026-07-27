import express from "express";
import fileUpload from "express-fileupload";
import mongoose from "mongoose";
import { authMiddleware, isAdmin } from "../middleware/authMiddleware.js";
import { getBucket } from "../utils/gridfs.js";

import {
  uploadLaporan,
  getLaporanList,
  getLaporanPeserta,
  updateDeskripsiLaporan,
  deleteLaporan,
  uploadLaporanBase64,
  adminReviewLaporan,
  updateLaporanFile,
  updateLaporanBase64ById,
  cleanupOrphanedFiles,
} from "../controllers/laporanController.js";

const router = express.Router();

// ✅ Express FileUpload (aman untuk Vercel serverless)
router.use(fileUpload({
  limits: { fileSize: 4 * 1024 * 1024 }, // 4MB
  abortOnLimit: true,
}));

// Upload laporan oleh peserta (multipart)
router.post("/", authMiddleware, uploadLaporan);

// Upload laporan via base64
router.post("/base64", authMiddleware, uploadLaporanBase64);

// Get laporan milik peserta
router.get("/", authMiddleware, getLaporanPeserta);

// ✅ Get semua laporan — dilindungi isAdmin middleware
router.get("/admin", authMiddleware, isAdmin, getLaporanList);

// ✅ ADMIN: nilai laporan — dilindungi isAdmin middleware
router.put("/admin/:id/review", authMiddleware, isAdmin, adminReviewLaporan);

// ✅ ADMIN: Bersihkan file hantu di GridFS
router.delete("/admin/cleanup", authMiddleware, isAdmin, cleanupOrphanedFiles);

// Update deskripsi (peserta)
router.put("/:id", authMiddleware, updateDeskripsiLaporan);

// ✅ PESERTA: kirim ulang laporan (replace file) multipart
router.put("/:id/file", authMiddleware, updateLaporanFile);

// ✅ PESERTA: kirim ulang laporan (replace file) base64
router.put("/:id/base64", authMiddleware, updateLaporanBase64ById);

// Hapus laporan
router.delete("/:id", authMiddleware, deleteLaporan);

// ✅ Download laporan berdasarkan fileId GridFS
// ✅ Ownership check: peserta hanya bisa download file miliknya; admin bisa semua
router.get("/download/:fileId", authMiddleware, async (req, res) => {
  try {
    const bucket = getBucket();
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);

    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files.length) return res.status(404).json({ msg: "File tidak ditemukan" });

    const f = files[0];

    // ✅ Verifikasi kepemilikan file (kecuali admin)
    if (req.user.role !== "admin") {
      const ownerId = f.metadata?.userId?.toString();
      if (!ownerId || ownerId !== req.user.id.toString()) {
        return res.status(403).json({ msg: "Akses ditolak. File bukan milik Anda." });
      }
    }

    // ✅ Sanitasi filename — hilangkan karakter berbahaya (path traversal, dll)
    const safeFilename = f.filename.replace(/[^\w.\-]/g, "_");
    res.setHeader("Content-Type", f.contentType || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);

    bucket.openDownloadStream(fileId).pipe(res);
  } catch (err) {
    res.status(500).json({ msg: "Gagal download", error: err.message });
  }
});

export default router;
