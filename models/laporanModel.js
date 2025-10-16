import mongoose from "mongoose";

const laporanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  judul: {
    type: String,
    required: true,
  },
  deskripsi: {
    type: String,
  },
  file: {
    type: String, // hanya nama file, misalnya "1743798641180-essay.docx"
    required: true,
  },
}, { timestamps: true });

export default mongoose.model("Laporan", laporanSchema);
