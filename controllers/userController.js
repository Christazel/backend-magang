import mongoose from "mongoose";
import User from "../models/userModel.js";
import Presensi from "../models/presensiModel.js";
import Laporan from "../models/laporanModel.js";
import { getBucket } from "../utils/gridfs.js";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Basic list peserta (dipakai di tempat lain jika butuh).
 * Tidak berisi statistik.
 */
export const getAllPeserta = async (req, res) => {
  try {
    const peserta = await User.find({ role: "peserta" }).select("name email _id");
    res.status(200).json(peserta);
  } catch (error) {
    console.error("[getAllPeserta] Error:", error);
    res.status(500).json({ msg: "Gagal mengambil data peserta", error: isProduction ? undefined : error.message });
  }
};

/**
 * Admin: ambil semua peserta beserta jumlah hadir & jumlah tugas.
 * Menggunakan aggregate supaya performa bagus di data besar.
 * Response:
 * [
 *   { _id, name, email, hadir: <number>, tugas: <number> }
 * ]
 */
export const getAllPesertaWithStats = async (req, res) => {
  try {
    // 1) Ambil semua user peserta
    const users = await User.find({ role: "peserta" }).select("_id name email");

    // 2) Aggregate presensi -> hitung 'hadir' (record yang punya jamMasuk)
    const presensiAgg = await Presensi.aggregate([
      { $match: { jamMasuk: { $exists: true, $ne: null } } },
      { $group: { _id: "$user", hadir: { $sum: 1 } } },
    ]);

    // 3) Aggregate laporan -> hitung jumlah tugas per user
    const laporanAgg = await Laporan.aggregate([
      { $group: { _id: "$user", tugas: { $sum: 1 } } },
    ]);

    // 4) Jadikan map untuk lookup cepat
    const hadirMap = new Map(presensiAgg.map((d) => [String(d._id), d.hadir]));
    const tugasMap = new Map(laporanAgg.map((d) => [String(d._id), d.tugas]));

    // 5) Gabungkan ke list user
    const data = users.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      hadir: hadirMap.get(String(u._id)) || 0,
      tugas: tugasMap.get(String(u._id)) || 0,
    }));

    res.status(200).json(data);
  } catch (error) {
    console.error("❌ getAllPesertaWithStats error:", error);
    res.status(500).json({ msg: "Gagal mengambil data peserta (stats)", error: isProduction ? undefined : error.message });
  }
};

/**
 * Admin: Menghapus peserta secara permanen berserta seluruh rekam jejak (Cascading Delete)
 */
export const deletePeserta = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: "User tidak ditemukan" });
    if (user.role === "admin") return res.status(403).json({ msg: "Tidak dapat menghapus admin" });

    // 1. Cari semua laporan milik peserta
    const laporans = await Laporan.find({ user: user._id });
    
    // 2. Hapus file-file PDF di GridFS
    const bucket = getBucket();
    for (const lap of laporans) {
      if (lap.fileId) {
        try {
          await bucket.delete(new mongoose.Types.ObjectId(lap.fileId));
        } catch (e) {
          console.warn(`[GridFS] Gagal hapus file terkait laporan: ${lap.fileId}`);
        }
      }
    }

    // 3. Hapus semua data Laporan dan Presensi secara permanen
    await Laporan.deleteMany({ user: user._id });
    await Presensi.deleteMany({ user: user._id });

    // 4. Hapus User
    await user.deleteOne();

    res.status(200).json({ msg: "Peserta beserta seluruh riwayat presensi, laporan, dan file berhasil dibersihkan (Cascading Delete)." });
  } catch (error) {
    console.error("[deletePeserta] Error:", error);
    res.status(500).json({ msg: "Gagal menghapus peserta", error: isProduction ? undefined : error.message });
  }
};

// ─────────────────────────────────────────────────
// [ADMIN] PUT /api/users/:id/reset-password — Reset password peserta
// ─────────────────────────────────────────────────
import bcrypt from "bcryptjs";

export const resetPasswordPeserta = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ msg: "User tidak ditemukan" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ msg: "Tidak dapat mereset password admin lain" });
    }

    const defaultPassword = process.env.DEFAULT_PASSWORD || "Magang123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ msg: `Password berhasil direset menjadi: ${defaultPassword}` });
  } catch (error) {
    console.error("[resetPasswordPeserta] Error:", error);
    res.status(500).json({ msg: "Gagal mereset password", error: isProduction ? undefined : error.message });
  }
};

