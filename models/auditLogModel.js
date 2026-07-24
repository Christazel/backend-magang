import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Bisa admin atau peserta
      required: true,
      index: true,
    },
    details: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("AuditLog", auditLogSchema);
