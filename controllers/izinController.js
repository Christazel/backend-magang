// ======= controllers/izinController.js =======
import Izin from "../models/izinModel.js";
import User from "../models/userModel.js";
import moment from "moment-timezone";

const TIMEZONE = process.env.TIMEZONE || "Asia/Jakarta";
const isProduction = process.env.NODE_ENV === "production";

// ─────────────────────────────────────────────────
// [PESERTA] POST /api/izin — Ajukan Izin / Sakit
// ─────────────────────────────────────────────────
export const ajukanIzin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tanggal, jenis, keterangan } = req.body;

    // Validasi field wajib
    if (!tanggal || !jenis) {
      return res.status(400).json({ msg: "Tanggal dan jenis izin wajib diisi." });
    }

    // Validasi format tanggal
    if (!moment(tanggal, "YYYY-MM-DD", true).isValid()) {
      return res.status(400).json({ msg: "Format tanggal tidak valid. Gunakan YYYY-MM-DD." });
    }

    // Validasi jenis
    if (!["izin", "sakit"].includes(jenis)) {
      return res.status(400).json({ msg: "Jenis harus 'izin' atau 'sakit'." });
    }

    // Validasi tanggal tidak boleh terlalu jauh ke masa depan (maks 7 hari ke depan)
    const tgl = moment.tz(tanggal, "YYYY-MM-DD", TIMEZONE);
    const today = moment().tz(TIMEZONE).startOf("day");
    const maxFuture = today.clone().add(7, "days");
    const minPast = today.clone().subtract(30, "days"); // bisa ajukan untuk max 30 hari lalu

    if (tgl.isAfter(maxFuture)) {
      return res.status(400).json({ msg: "Tidak bisa mengajukan izin lebih dari 7 hari ke depan." });
    }
    if (tgl.isBefore(minPast)) {
      return res.status(400).json({ msg: "Tidak bisa mengajukan izin lebih dari 30 hari yang lalu." });
    }

    // Cek duplikat
    const existing = await Izin.findOne({ user: userId, tanggal });
    if (existing) {
      return res.status(409).json({ msg: `Sudah ada pengajuan ${existing.jenis} untuk tanggal ${tanggal}.` });
    }

    const izin = await Izin.create({
      user: userId,
      tanggal,
      jenis,
      keterangan: keterangan?.trim() || "",
    });

    res.status(201).json({ msg: "Pengajuan berhasil dikirim, menunggu persetujuan Admin.", izin });
  } catch (error) {
    console.error("[ajukanIzin] Error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ msg: "Sudah ada pengajuan izin untuk tanggal tersebut." });
    }
    res.status(500).json({ msg: "Gagal mengajukan izin.", error: isProduction ? undefined : error.message });
  }
};

// ─────────────────────────────────────────────────
// [PESERTA] GET /api/izin — Riwayat izin milik sendiri
// ─────────────────────────────────────────────────
export const getMyIzin = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const [data, totalCount] = await Promise.all([
      Izin.find({ user: userId })
        .sort({ tanggal: -1 })
        .skip(skip)
        .limit(limit),
      Izin.countDocuments({ user: userId }),
    ]);

    res.set("X-Total-Count", totalCount);
    res.set("X-Total-Pages", Math.ceil(totalCount / limit));
    res.set("X-Current-Page", page);
    res.set("X-Per-Page", limit);
    res.set("Access-Control-Expose-Headers", "X-Total-Count, X-Total-Pages, X-Current-Page, X-Per-Page");

    res.json(data);
  } catch (error) {
    console.error("[getMyIzin] Error:", error);
    res.status(500).json({ msg: "Gagal mengambil riwayat izin.", error: isProduction ? undefined : error.message });
  }
};

// ─────────────────────────────────────────────────
// [PESERTA] DELETE /api/izin/:id — Batalkan pengajuan (hanya jika masih pending)
// ─────────────────────────────────────────────────
export const deleteIzin = async (req, res) => {
  try {
    const userId = req.user.id;
    const izin = await Izin.findById(req.params.id);

    if (!izin) return res.status(404).json({ msg: "Pengajuan izin tidak ditemukan." });
    if (String(izin.user) !== String(userId)) {
      return res.status(403).json({ msg: "Anda tidak berhak membatalkan pengajuan ini." });
    }
    if (izin.status !== "pending") {
      return res.status(400).json({ msg: `Pengajuan sudah berstatus '${izin.status}', tidak bisa dibatalkan.` });
    }

    await izin.deleteOne();
    res.json({ msg: "Pengajuan izin berhasil dibatalkan." });
  } catch (error) {
    console.error("[deleteIzin] Error:", error);
    res.status(500).json({ msg: "Gagal membatalkan pengajuan.", error: isProduction ? undefined : error.message });
  }
};

// ─────────────────────────────────────────────────
// [ADMIN] GET /api/izin/admin — Semua pengajuan izin
// ─────────────────────────────────────────────────
export const getAllIzin = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    const statusFilter = req.query.status || ""; // 'pending' | 'disetujui' | 'ditolak'

    let userIds = null;
    if (search) {
      const matchedUsers = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      userIds = matchedUsers.map((u) => u._id);
    }

    const query = {};
    if (userIds) query.user = { $in: userIds };
    if (statusFilter && ["pending", "disetujui", "ditolak"].includes(statusFilter)) {
      query.status = statusFilter;
    }

    const [data, totalCount] = await Promise.all([
      Izin.find(query)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Izin.countDocuments(query),
    ]);

    res.set("X-Total-Count", totalCount);
    res.set("X-Total-Pages", Math.ceil(totalCount / limit));
    res.set("X-Current-Page", page);
    res.set("X-Per-Page", limit);
    res.set("Access-Control-Expose-Headers", "X-Total-Count, X-Total-Pages, X-Current-Page, X-Per-Page");

    res.json(data);
  } catch (error) {
    console.error("[getAllIzin] Error:", error);
    res.status(500).json({ msg: "Gagal mengambil data izin.", error: isProduction ? undefined : error.message });
  }
};

// ─────────────────────────────────────────────────
// [ADMIN] PUT /api/izin/:id/approve — Setujui atau tolak pengajuan
// ─────────────────────────────────────────────────
export const approveIzin = async (req, res) => {
  try {
    const { status, catatanAdmin } = req.body;

    if (!status || !["disetujui", "ditolak"].includes(status)) {
      return res.status(400).json({ msg: "Status harus 'disetujui' atau 'ditolak'." });
    }

    const izin = await Izin.findById(req.params.id);
    if (!izin) return res.status(404).json({ msg: "Pengajuan izin tidak ditemukan." });
    if (izin.status !== "pending") {
      return res.status(400).json({ msg: `Pengajuan sudah berstatus '${izin.status}'.` });
    }

    izin.status = status;
    izin.catatanAdmin = catatanAdmin?.trim() || "";
    await izin.save();

    const label = status === "disetujui" ? "disetujui ✅" : "ditolak ❌";
    res.json({ msg: `Pengajuan izin berhasil ${label}.`, izin });
  } catch (error) {
    console.error("[approveIzin] Error:", error);
    res.status(500).json({ msg: "Gagal memproses pengajuan.", error: isProduction ? undefined : error.message });
  }
};
