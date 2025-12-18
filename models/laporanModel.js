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
    },

    deskripsi: {
      type: String,
      default: "",
      trim: true,
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
  },
  { timestamps: true }
);

export default mongoose.model("Laporan", laporanSchema);
