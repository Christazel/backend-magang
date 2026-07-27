// ======= models/izinModel.js =======
import mongoose from "mongoose";

const izinSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tanggal: {
      type: String, // format: YYYY-MM-DD
      required: true,
    },
    jenis: {
      type: String,
      enum: ["izin", "sakit"],
      required: true,
    },
    keterangan: {
      type: String,
      maxlength: [500, "Keterangan maksimal 500 karakter"],
      default: "",
    },
    // opsional: URL/path bukti surat dokter jika menggunakan upload
    fileBukti: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "disetujui", "ditolak"],
      default: "pending",
    },
    catatanAdmin: {
      type: String,
      maxlength: [300, "Catatan admin maksimal 300 karakter"],
      default: "",
    },
  },
  { timestamps: true }
);

// ✅ Compound index: 1 user hanya bisa punya 1 pengajuan izin per hari
izinSchema.index({ user: 1, tanggal: 1 }, { unique: true });

export default mongoose.model("Izin", izinSchema);
