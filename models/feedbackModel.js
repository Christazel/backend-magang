import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    feedback: {
      type: String,
      required: true,
      trim: true,
      maxlength: [2000, "Feedback maksimal 2000 karakter"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Feedback", feedbackSchema);
