// ======= models/presensiModel.js =======
import mongoose from "mongoose";

const presensiSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  tanggal: {
    type: String, // format: YYYY-MM-DD
    required: true,
  },
  jamMasuk: { type: String },
  jamKeluar: { type: String },
  lokasiMasuk: { type: String },
  lokasiKeluar: { type: String },
}, { timestamps: true });

export default mongoose.model("Presensi", presensiSchema);
