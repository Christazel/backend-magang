import mongoose from "mongoose";
import { Readable } from "stream";
import Laporan from "../models/laporanModel.js";
import { getBucket } from "../utils/gridfs.js";

// ✅ Upload laporan oleh peserta (multipart/form-data)
export const uploadLaporan = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "File tidak ditemukan." });

    const { judul, deskripsi } = req.body;
    const bucket = getBucket();

    const gfsFilename = `${Date.now()}-${req.file.originalname}`;

    const uploadStream = bucket.openUploadStream(gfsFilename, {
      contentType: req.file.mimetype,
      metadata: { userId: req.user.id, originalname: req.file.originalname },
    });

    Readable.from(req.file.buffer).pipe(uploadStream);

    uploadStream.on("error", (e) => {
      return res.status(500).json({ msg: "Gagal upload laporan", error: e.message });
    });

    uploadStream.on("finish", async (file) => {
      const laporan = await Laporan.create({
        user: req.user.id,

        // ✅ judul dari form, fallback ke nama file
        judul: (judul && judul.trim()) ? judul.trim() : req.file.originalname,
        deskripsi: deskripsi || "",

        // ✅ GridFS file id
        fileId: uploadStream.id,

        // metadata
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        gfsFilename,
        size: file?.length || req.file.size || 0,
      });

      return res.status(201).json({ msg: "Laporan berhasil diupload", laporan });
    });
  } catch (error) {
    return res.status(500).json({ msg: "Gagal upload laporan", error: error.message });
  }
};

// ✅ Ambil laporan milik peserta
export const getLaporanPeserta = async (req, res) => {
  try {
    const laporan = await Laporan.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(laporan);
  } catch (error) {
    res.status(500).json({ msg: "Gagal mengambil laporan", error: error.message });
  }
};

// ✅ Ambil semua laporan (admin)
export const getLaporanList = async (req, res) => {
  try {
    if (req.user.role !== "admin") return res.status(403).json({ msg: "Akses ditolak" });

    const laporanList = await Laporan.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json(laporanList);
  } catch (error) {
    res.status(500).json({ msg: "Gagal mengambil laporan", error: error.message });
  }
};

// ✅ Update deskripsi laporan
export const updateDeskripsiLaporan = async (req, res) => {
  try {
    const { deskripsi } = req.body;

    const laporan = await Laporan.findOne({ _id: req.params.id, user: req.user.id });
    if (!laporan) return res.status(404).json({ msg: "Laporan tidak ditemukan" });

    laporan.deskripsi = (deskripsi ?? laporan.deskripsi);
    await laporan.save();

    res.status(200).json({ msg: "Deskripsi berhasil diupdate", laporan });
  } catch (error) {
    res.status(500).json({ msg: "Gagal update deskripsi", error: error.message });
  }
};

// ✅ Hapus laporan + hapus file GridFS
export const deleteLaporan = async (req, res) => {
  try {
    const bucket = getBucket();

    const laporan = await Laporan.findOne({ _id: req.params.id, user: req.user.id });
    if (!laporan) return res.status(404).json({ msg: "Laporan tidak ditemukan" });

    await bucket.delete(new mongoose.Types.ObjectId(laporan.fileId));
    await laporan.deleteOne();

    res.status(200).json({ msg: "Laporan berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ msg: "Gagal menghapus laporan", error: error.message });
  }
};

// ✅ Upload laporan via base64
export const uploadLaporanBase64 = async (req, res) => {
  try {
    const { filename, base64, judul, deskripsi, mimeType } = req.body;
    if (!filename || !base64) return res.status(400).json({ msg: "Data base64 tidak lengkap." });

    const bucket = getBucket();
    const buffer = Buffer.from(base64, "base64");

    const gfsFilename = `${Date.now()}-${filename}`;
    const uploadStream = bucket.openUploadStream(gfsFilename, {
      contentType: mimeType || "application/octet-stream",
      metadata: { userId: req.user.id, originalname: filename },
    });

    Readable.from(buffer).pipe(uploadStream);

    uploadStream.on("error", (e) => {
      return res.status(500).json({ msg: "Gagal upload laporan base64", error: e.message });
    });

    uploadStream.on("finish", async (file) => {
      const laporan = await Laporan.create({
        user: req.user.id,
        judul: (judul && judul.trim()) ? judul.trim() : filename,
        deskripsi: deskripsi || "",
        fileId: uploadStream.id,
        originalName: filename,
        mimeType: mimeType || "application/octet-stream",
        gfsFilename,
        size: file?.length || buffer.length || 0,
      });

      return res.status(201).json({ msg: "Laporan berhasil diupload (Web)", laporan });
    });
  } catch (error) {
    res.status(500).json({ msg: "Gagal upload laporan base64", error: error.message });
  }
};
