import mongoose from "mongoose";
import { Readable } from "stream";
import Laporan from "../models/laporanModel.js";
import User from "../models/userModel.js";
import { getBucket } from "../utils/gridfs.js";

// Batas ukuran file (4MB dalam bytes)
const MAX_FILE_SIZE = 4 * 1024 * 1024;

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

        // ✅ penilaian default
        status: "pending",
        reviewed: false,
        adminCatatan: "",
        reviewedBy: null,
        reviewedAt: null,
      });

      return res.status(201).json({ msg: "Laporan berhasil diupload", laporan });
    });
  } catch (error) {
    return res.status(500).json({ msg: "Gagal upload laporan", error: error.message });
  }
};

// ✅ Ambil laporan milik peserta (dengan Pagination via Header)
export const getLaporanPeserta = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const laporan = await Laporan.find({ user: req.user.id })
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Laporan.countDocuments({ user: req.user.id });

    res.set("X-Total-Count", totalCount);
    res.set("X-Total-Pages", Math.ceil(totalCount / limit));
    res.set("X-Current-Page", page);
    res.set("X-Per-Page", limit);
    res.set("Access-Control-Expose-Headers", "X-Total-Count, X-Total-Pages, X-Current-Page, X-Per-Page");

    res.status(200).json(laporan);
  } catch (error) {
    res.status(500).json({ msg: "Gagal mengambil laporan", error: error.message });
  }
};

// ✅ Ambil semua laporan (admin) — support Search + Pagination via Header
export const getLaporanList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    let query = {};

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");
      const userIds = users.map((u) => u._id);
      
      // Bisa search berdasarkan nama/email user ATAU judul laporan
      query = {
        $or: [
          { user: { $in: userIds } },
          { judul: { $regex: search, $options: "i" } }
        ]
      };
    }

    const laporanList = await Laporan.find(query)
      .populate("user", "name email")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalCount = await Laporan.countDocuments(query);

    res.set("X-Total-Count", totalCount);
    res.set("X-Total-Pages", Math.ceil(totalCount / limit));
    res.set("X-Current-Page", page);
    res.set("X-Per-Page", limit);
    res.set("Access-Control-Expose-Headers", "X-Total-Count, X-Total-Pages, X-Current-Page, X-Per-Page");

    res.status(200).json(laporanList);
  } catch (error) {
    res.status(500).json({ msg: "Gagal mengambil laporan", error: error.message });
  }
};

// ✅ Update deskripsi laporan (peserta)
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

    // ✅ Validasi ukuran file sebelum diproses (cegah OOM / DoS)
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(413).json({
        msg: `Ukuran file melebihi batas maksimal (${MAX_FILE_SIZE / 1024 / 1024}MB).`,
      });
    }

    const bucket = getBucket();

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

        // ✅ penilaian default
        status: "pending",
        reviewed: false,
        adminCatatan: "",
        reviewedBy: null,
        reviewedAt: null,
      });

      return res.status(201).json({ msg: "Laporan berhasil diupload (Web)", laporan });
    });
  } catch (error) {
    res.status(500).json({ msg: "Gagal upload laporan base64", error: error.message });
  }
};

// ✅ ADMIN REVIEW — role check dilakukan di route middleware isAdmin
export const adminReviewLaporan = async (req, res) => {
  try {
    const { status, adminCatatan } = req.body;

    if (!["sesuai", "revisi", "pending"].includes(status)) {
      return res.status(400).json({ msg: "Status tidak valid. Gunakan: pending | sesuai | revisi" });
    }

    const laporan = await Laporan.findById(req.params.id);
    if (!laporan) return res.status(404).json({ msg: "Laporan tidak ditemukan" });

    laporan.status = status;
    laporan.adminCatatan = (adminCatatan ?? "").toString();
    laporan.reviewed = status !== "pending";
    laporan.reviewedBy = req.user.id;
    laporan.reviewedAt = new Date();

    await laporan.save();

    const populated = await Laporan.findById(laporan._id)
      .populate("user", "name email")
      .populate("reviewedBy", "name email");

    return res.status(200).json({ msg: "Penilaian laporan berhasil disimpan", laporan: populated });
  } catch (error) {
    return res.status(500).json({ msg: "Gagal menilai laporan", error: error.message });
  }
};

// ✅ PESERTA: kirim ulang laporan (replace file) — MULTIPART
export const updateLaporanFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ msg: "File tidak ditemukan." });

    const bucket = getBucket();

    const laporan = await Laporan.findOne({ _id: req.params.id, user: req.user.id });
    if (!laporan) return res.status(404).json({ msg: "Laporan tidak ditemukan" });

    const oldFileId = laporan.fileId;

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
      // update laporan ke file baru
      laporan.fileId = uploadStream.id;
      laporan.originalName = req.file.originalname;
      laporan.mimeType = req.file.mimetype;
      laporan.gfsFilename = gfsFilename;
      laporan.size = file?.length || req.file.size || 0;

      // ✅ reset penilaian agar admin nilai ulang
      laporan.status = "pending";
      laporan.reviewed = false;
      laporan.adminCatatan = "";
      laporan.reviewedBy = null;
      laporan.reviewedAt = null;

      await laporan.save();

      // ✅ Hapus file lama — log warning jika gagal agar bisa dideteksi
      try {
        await bucket.delete(new mongoose.Types.ObjectId(oldFileId));
      } catch (deleteErr) {
        console.warn(`[GridFS] Gagal hapus file lama (fileId: ${oldFileId}):`, deleteErr.message);
      }

      return res.status(200).json({ msg: "Laporan berhasil dikirim ulang. Menunggu penilaian admin.", laporan });
    });
  } catch (error) {
    return res.status(500).json({ msg: "Gagal mengirim ulang laporan", error: error.message });
  }
};

// ✅ PESERTA: kirim ulang laporan (replace file) — BASE64
export const updateLaporanBase64ById = async (req, res) => {
  try {
    const { filename, base64, mimeType } = req.body;
    if (!filename || !base64) return res.status(400).json({ msg: "Data base64 tidak lengkap." });

    // ✅ Validasi ukuran file sebelum diproses
    const buffer = Buffer.from(base64, "base64");
    if (buffer.length > MAX_FILE_SIZE) {
      return res.status(413).json({
        msg: `Ukuran file melebihi batas maksimal (${MAX_FILE_SIZE / 1024 / 1024}MB).`,
      });
    }

    const bucket = getBucket();

    const laporan = await Laporan.findOne({ _id: req.params.id, user: req.user.id });
    if (!laporan) return res.status(404).json({ msg: "Laporan tidak ditemukan" });

    const oldFileId = laporan.fileId;

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
      laporan.fileId = uploadStream.id;
      laporan.originalName = filename;
      laporan.mimeType = mimeType || "application/octet-stream";
      laporan.gfsFilename = gfsFilename;
      laporan.size = file?.length || buffer.length || 0;

      // ✅ reset penilaian agar admin nilai ulang
      laporan.status = "pending";
      laporan.reviewed = false;
      laporan.adminCatatan = "";
      laporan.reviewedBy = null;
      laporan.reviewedAt = null;

      await laporan.save();

      // ✅ Hapus file lama — log warning jika gagal
      try {
        await bucket.delete(new mongoose.Types.ObjectId(oldFileId));
      } catch (deleteErr) {
        console.warn(`[GridFS] Gagal hapus file lama (fileId: ${oldFileId}):`, deleteErr.message);
      }

      return res.status(200).json({ msg: "Laporan berhasil dikirim ulang (Web). Menunggu penilaian admin.", laporan });
    });
  } catch (error) {
    return res.status(500).json({ msg: "Gagal mengirim ulang laporan base64", error: error.message });
  }
};
