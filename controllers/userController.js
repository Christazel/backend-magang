import User from "../models/user.js";
import Presensi from "../models/presensiModel.js";
import Laporan from "../models/laporanModel.js";

/**
 * Basic list peserta (dipakai di tempat lain jika butuh).
 * Tidak berisi statistik.
 */
export const getAllPeserta = async (req, res) => {
  try {
    const peserta = await User.find({ role: "peserta" }).select("name email _id");
    res.status(200).json(peserta);
  } catch (error) {
    res.status(500).json({ msg: "Gagal mengambil data peserta", error: error.message });
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
    res.status(500).json({ msg: "Gagal mengambil data peserta (stats)", error: error.message });
  }
};
