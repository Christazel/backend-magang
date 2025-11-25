// ======= controllers/presensiController.js =======
import Presensi from "../models/presensiModel.js";
import moment from "moment-timezone";

const APP_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Jakarta";

// Helper: selalu ambil waktu di zona Asia/Jakarta
const nowJakarta = () => moment().tz(APP_TIMEZONE);

// ✅ Absen Masuk
export const absenMasuk = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = nowJakarta();

    const tanggal = now.format("YYYY-MM-DD");

    let presensi = await Presensi.findOne({ user: userId, tanggal });
    if (presensi && presensi.jamMasuk) {
      return res.status(400).json({ msg: "Anda sudah absen masuk hari ini." });
    }

    if (!presensi) {
      presensi = new Presensi({ user: userId, tanggal });
    }

    presensi.jamMasuk = now.format("HH:mm:ss");
    presensi.lokasiMasuk = `${req.body.latitude},${req.body.longitude}`;
    await presensi.save();

    res.json({ msg: "Absen masuk berhasil", presensi });
  } catch (error) {
    res.status(500).json({ msg: "Gagal absen masuk", error: error.message });
  }
};

// ✅ Absen Keluar
export const absenKeluar = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = nowJakarta();

    const tanggal = now.format("YYYY-MM-DD");

    let presensi = await Presensi.findOne({ user: userId, tanggal });
    if (!presensi || !presensi.jamMasuk) {
      return res.status(400).json({ msg: "Belum absen masuk" });
    }
    if (presensi.jamKeluar) {
      return res.status(400).json({ msg: "Sudah absen keluar hari ini" });
    }

    presensi.jamKeluar = now.format("HH:mm:ss");
    presensi.lokasiKeluar = `${req.body.latitude},${req.body.longitude}`;
    await presensi.save();

    res.json({ msg: "Absen keluar berhasil", presensi });
  } catch (error) {
    res.status(500).json({ msg: "Gagal absen keluar", error: error.message });
  }
};

// ✅ Ambil presensi hari ini
export const getPresensiHariIni = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = nowJakarta();
    const tanggal = now.format("YYYY-MM-DD");

    const presensi = await Presensi.findOne({ user: userId, tanggal });
    res.json(presensi || {});
  } catch (error) {
    res.status(500).json({ msg: "Gagal ambil data", error: error.message });
  }
};

// ✅ Ambil riwayat presensi user
export const getRiwayatPresensi = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await Presensi.find({ user: userId }).sort({ tanggal: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ msg: "Gagal ambil riwayat", error: error.message });
  }
};

// ✅ Ambil semua presensi (khusus admin)
export const getAllPresensi = async (req, res) => {
  try {
    const data = await Presensi.find()
      .populate("user", "name email")
      .sort({ tanggal: -1 });

    const filteredData = data.filter((item) => item.user !== null);
    res.status(200).json(filteredData);
  } catch (error) {
    res
      .status(500)
      .json({ msg: "Gagal ambil semua data", error: error.message });
  }
};
