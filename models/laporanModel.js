import mongoose from "mongoose";

const laporanSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Judul laporan (input user, misal: "Laporan Mingguan 1")
    judul: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Judul laporan maksimal 200 karakter"],
    },

    deskripsi: {
      type: String,
      default: "",
      trim: true,
      maxlength: [2000, "Deskripsi laporan maksimal 2000 karakter"],
    },

    // ✅ ID file GridFS (yang dipakai buat download)
    fileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    // Metadata file biar rapi (optional tapi berguna)
    originalName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      default: "application/octet-stream",
    },
    gfsFilename: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      default: 0,
    },

    // =========================
    // ✅ FITUR PENILAIAN ADMIN
    // =========================
    status: {
      type: String,
      enum: ["pending", "sesuai", "revisi"], // pending=belum dinilai / menunggu, sesuai=OK, revisi=perlu perbaikan
      default: "pending",
      index: true,
    },

    adminCatatan: {
      type: String,
      default: "",
      trim: true,
      maxlength: [1000, "Catatan admin maksimal 1000 karakter"],
    },

    reviewed: {
      type: Boolean,
      default: false,
      index: true,
    },

    dibacaPeserta: {
      type: Boolean,
      default: false,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Laporan", laporanSchema);
