import express from "express";
import multer from "multer";
import path from "path";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  uploadLaporan,
  getLaporanList,
  getLaporanPeserta,
  updateDeskripsiLaporan, // <---
  deleteLaporan            // <---
} from "../controllers/laporanController.js";
import { uploadLaporanBase64 } from "../controllers/laporanController.js";

const router = express.Router();

// Konfigurasi Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/laporan");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Upload laporan oleh peserta
router.post("/", authMiddleware, upload.single("file"), uploadLaporan);

// Get laporan milik peserta yang sedang login
router.get("/", authMiddleware, getLaporanPeserta);

// Get semua laporan (untuk admin)
router.get("/admin", authMiddleware, getLaporanList);

// Download laporan berdasarkan nama file
router.get("/download/:filename", (req, res) => {
  const filePath = path.resolve("uploads/laporan", req.params.filename);
  res.download(filePath, (err) => {
    if (err) {
      return res.status(404).json({ msg: "File tidak ditemukan" });
    }
  });
});

export default router;

router.put("/:id", authMiddleware, updateDeskripsiLaporan); // ✅ update deskripsi

router.delete("/:id", authMiddleware, deleteLaporan);       // ✅ hapus laporan

// Upload laporan via base64 dari Web (jika ada base64)
router.post("/base64", authMiddleware, uploadLaporanBase64);
