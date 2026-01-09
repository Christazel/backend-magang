// ======= controllers/presensiController.js =======
import Presensi from "../models/presensiModel.js";
import moment from "moment-timezone";

const TIMEZONE = process.env.TIMEZONE || "Asia/Jakarta";

// Default window (kalau env tidak diset)
const PRESENSI_MASUK_START = process.env.PRESENSI_MASUK_START || "08:00:00";
const PRESENSI_MASUK_END = process.env.PRESENSI_MASUK_END || "08:59:59";

const PRESENSI_KELUAR_START = process.env.PRESENSI_KELUAR_START || "16:00:00";
const PRESENSI_KELUAR_END = process.env.PRESENSI_KELUAR_END || "23:59:59";

const buildMomentAt = (tanggalYYYYMMDD, timeHHmmss) => {
  return moment.tz(`${tanggalYYYYMMDD} ${timeHHmmss}`, "YYYY-MM-DD HH:mm:ss", TIMEZONE);
};

const assertWithinWindow = (now, start, end, label) => {
  if (!now.isBetween(start, end, undefined, "[]")) {
    return {
      ok: false,
      status: 403,
      msg: `Presensi ${label} hanya bisa pada ${start.format("HH:mm:ss")} - ${end.format(
        "HH:mm:ss"
      )} WIB. Sekarang: ${now.format("HH:mm:ss")} WIB.`,
    };
  }
  return { ok: true };
};

// ✅ Absen Masuk
export const absenMasuk = async (req, res) => {
  try {
    const userId = req.user.id;

    const now = moment().tz(TIMEZONE);
    const tanggal = now.format("YYYY-MM-DD");

    // Validasi jam masuk
    const start = buildMomentAt(tanggal, PRESENSI_MASUK_START);
    const end = buildMomentAt(tanggal, PRESENSI_MASUK_END);
    const gate = assertWithinWindow(now, start, end, "masuk");
    if (!gate.ok) return res.status(gate.status).json({ msg: gate.msg });

    let presensi = await Presensi.findOne({ user: userId, tanggal });
    if (presensi && presensi.jamMasuk) {
      return res.status(400).json({ msg: "Anda sudah absen masuk hari ini." });
    }

    if (!presensi) presensi = new Presensi({ user: userId, tanggal });

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

    const now = moment().tz(TIMEZONE);
    const tanggal = now.format("YYYY-MM-DD");

    // Validasi jam keluar
    const start = buildMomentAt(tanggal, PRESENSI_KELUAR_START);
    const end = buildMomentAt(tanggal, PRESENSI_KELUAR_END);
    const gate = assertWithinWindow(now, start, end, "keluar");
    if (!gate.ok) return res.status(gate.status).json({ msg: gate.msg });

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
    const tanggal = moment().tz(TIMEZONE).format("YYYY-MM-DD");

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
    res.status(500).json({ msg: "Gagal ambil semua data", error: error.message });
  }
};
