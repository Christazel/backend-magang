import Laporan from "../models/laporanModel.js";
import path from "path";
import fs from "fs";

// ✅ Upload laporan oleh peserta
export const uploadLaporan = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "File tidak ditemukan." });
    }

    const { deskripsi } = req.body;

    const laporan = new Laporan({
      user: req.user.id,
      judul: req.file.originalname,
      deskripsi: deskripsi || "",
      file: req.file.filename
    });

    await laporan.save();
    res.status(201).json({ msg: "Laporan berhasil diupload", laporan });
  } catch (error) {
    res.status(500).json({ msg: "Gagal upload laporan", error: error.message });
  }
};

// ✅ Ambil laporan milik peserta yang sedang login
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
    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Akses ditolak" });
    }

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

    if (!laporan) {
      return res.status(404).json({ msg: "Laporan tidak ditemukan" });
    }

    laporan.deskripsi = deskripsi;
    await laporan.save();

    res.status(200).json({ msg: "Deskripsi berhasil diupdate" });
  } catch (error) {
    res.status(500).json({ msg: "Gagal update deskripsi", error: error.message });
  }
};

// ✅ Hapus laporan
export const deleteLaporan = async (req, res) => {
  try {
    const laporan = await Laporan.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!laporan) {
      return res.status(404).json({ msg: "Laporan tidak ditemukan" });
    }

    res.status(200).json({ msg: "Laporan berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ msg: "Gagal menghapus laporan", error: error.message });
  }
};

// ✅ Upload laporan via base64 dari Web
export const uploadLaporanBase64 = async (req, res) => {
  try {
    const { filename, base64, deskripsi } = req.body;

    if (!filename || !base64) {
      return res.status(400).json({ msg: "Data base64 tidak lengkap." });
    }

    // Simpan file ke folder
    const buffer = Buffer.from(base64, 'base64');
    const uploadDir = "uploads/laporan";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = `${uploadDir}/${Date.now()}-${filename}`;
    fs.writeFileSync(filePath, buffer);

    // Simpan ke database
    const laporan = new Laporan({
      user: req.user.id,
      judul: filename,
      deskripsi: deskripsi || "",
      file: filePath.split("/").pop(),
    });

    await laporan.save();
    res.status(201).json({ msg: "Laporan berhasil diupload (Web)", laporan });
  } catch (error) {
    console.error(error);
    res.status(500).json({ msg: "Gagal upload laporan base64", error: error.message });
  }
};
